import os
import re
import json
import requests
from pypdf import PdfReader
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_ENDPOINT = os.getenv(
    "OPENROUTER_BASE_URL", 
    "https://openrouter.ai/api/v1/chat/completions"
)

SYSTEM_PROMPT = (
    "You are an Elite Principal Technical Recruiter and ATS Algorithms Auditor. "
    "You evaluate resumes strictly against enterprise parsing criteria (e.g., Taleo, Greenhouse, Workday) "
    "and junior/intern/full-stack engineering standards. Output strictly valid JSON."
)

FAST_ROUTER_MODELS = [
    "deepseek/deepseek-chat",
    "openai/gpt-4o-mini",
    "meta-llama/llama-3.3-70b-instruct",
    "google/gemini-2.5-flash"
]

def extract_text_from_pdf(file_obj) -> str:
    reader = PdfReader(file_obj)
    extracted = [page.extract_text() for page in reader.pages if page.extract_text()]
    full_text = "\n".join(extracted).strip()
    if not full_text:
        raise ValueError(
            "ATS Parsing Failure: No selectable text layer found. Please upload a machine-readable text PDF."
        )
    return full_text

def _extract_json_block(raw_text: str):
    if not raw_text:
        raise ValueError("Empty response from AI engine.")

    text = raw_text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z]*\n?", "", text)
        text = re.sub(r"```$", "", text).strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    match = re.search(r"(\{.*\}|\[.*\])", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError as err:
            raise ValueError(f"JSON parsing error: {err}") from err

    raise ValueError("AI engine failed to generate a standard JSON block.")

def check_ats_formatting_compliance(pdf_file_obj, extracted_text: str) -> dict:
    reader = PdfReader(pdf_file_obj)
    page_count = len(reader.pages)
    word_count = len(extracted_text.split())
    text_lower = extracted_text.lower()

    has_email = bool(re.search(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", extracted_text))
    has_phone = bool(re.search(r"(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}", extracted_text))
    has_github = bool(re.search(r"github\.com/[a-zA-Z0-9-_]+", text_lower))
    has_linkedin = bool(re.search(r"linkedin\.com/in/[a-zA-Z0-9-_]+", text_lower))

    headers_detected = {
        "summary": bool(re.search(r"\b(summary|professional summary|profile)\b", text_lower)),
        "skills": bool(re.search(r"\b(technical skills|skills|technologies)\b", text_lower)),
        "experience": bool(re.search(r"\b(experience|work experience|employment history)\b", text_lower)),
        "projects": bool(re.search(r"\b(projects|technical projects)\b", text_lower)),
        "education": bool(re.search(r"\b(education|academic background)\b", text_lower)),
        "certifications": bool(re.search(r"\b(certifications|certificates|achievements)\b", text_lower)),
    }

    prohibited_detected = []
    if re.search(r"\b(father'?s? name|mother'?s? name)\b", text_lower):
        prohibited_detected.append("Parent names present (non-standard personal data).")
    if re.search(r"\b(religion|marital status|date of birth|dob|nationality|blood group|nid|passport)\b", text_lower):
        prohibited_detected.append("Extraneous personal details (religion/DOB/marital status/NID).")
    
    pronoun_match = re.findall(r"\b(i am|my|myself|we|me)\b", text_lower)
    has_first_person = len(pronoun_match) > 0
    has_rating_terms = bool(re.search(r"\b(expert|intermediate|beginner|\d{1,2}/\d{1,2}|\d{1,3}%)\b", text_lower))

    compliance_issues = []
    if page_count > 1: compliance_issues.append(f"Document has {page_count} pages.")
    if not has_email: compliance_issues.append("Email address not found.")
    if not has_phone: compliance_issues.append("Phone number not found.")
    if not has_github: compliance_issues.append("GitHub profile link missing.")
    if not has_linkedin: compliance_issues.append("LinkedIn profile link missing.")
    if not headers_detected["skills"]: compliance_issues.append("'TECHNICAL SKILLS' header missing.")
    if not headers_detected["projects"]: compliance_issues.append("'PROJECTS' header missing.")
    if has_first_person: compliance_issues.append("Found first-person pronouns.")
    compliance_issues.extend(prohibited_detected)

    score = 100
    if page_count > 1: score -= 15
    if not (has_email and has_phone): score -= 20
    if not (has_github and has_linkedin): score -= 10
    if not (headers_detected["skills"] and headers_detected["projects"]): score -= 15
    if has_first_person: score -= 10
    if prohibited_detected: score -= 15
    if has_rating_terms: score -= 5
    if word_count < 300 or word_count > 900: score -= 10

    return {
        "atsComplianceScore": max(score, 10),
        "isAtsFriendly": max(score, 10) >= 75,
        "pageCount": page_count,
        "wordCount": word_count,
        "hasFirstPersonPronouns": has_first_person,
        "contactAudit": {"email": has_email, "phone": has_phone, "github": has_github, "linkedin": has_linkedin},
        "headersAudit": headers_detected,
        "prohibitedDetailsDetected": prohibited_detected,
        "issues": compliance_issues,
    }

def _call_openrouter_fast(prompt: str, json_mode: bool, temperature: float = 0.2) -> str:
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }

    endpoint_url = OPENROUTER_ENDPOINT
    last_err = None

    for model_id in FAST_ROUTER_MODELS:
        payload = {
            "model": model_id,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            "temperature": temperature,
            "max_tokens": 2048,
        }

        try:
            res = requests.post(
                endpoint_url,
                headers=headers,
                json=payload,
                timeout=25,
            )
            
            if res.status_code != 200:
                res.raise_for_status()

            data = res.json()
            content = data["choices"][0]["message"]["content"]
            if content:
                return content
                
        except Exception as e:
            last_err = e
            continue

    raise RuntimeError(f"All fast model routes failed. Last error: {last_err}")

def ask_multimodal_ai(prompt: str, json_mode: bool = True, temperature: float = 0.2) -> str:
    try:
        return _call_openrouter_fast(prompt, json_mode, temperature)
    except Exception as err:
        raise RuntimeError(f"AI Evaluation failed: {err}") from err

def analyze_resume_with_ai(resume_text: str, job_description: str) -> dict:
    prompt = f"""
Audit this resume against the JD strictly as a Software Engineering ATS.
JD: {job_description[:1000]}
Resume: {resume_text[:2000]}

Return STRICT JSON:
{{
  "score": 85,
  "subScores": {{"skills": 80, "experience": 90, "impact": 85, "formatting": 80}},
  "summary": "Short verdict",
  "matchedSkills": [],
  "missingSkills": [],
  "actionVerbAudit": {{"strongVerbsFound": [], "weakPhrasesFound": []}},
  "metricAudit": {{"hasQuantifiableMetrics": true, "verdict": "..."}},
  "suggestions": []
}}
"""
    raw_response = ask_multimodal_ai(prompt, json_mode=True)
    return _extract_json_block(raw_response)

def generate_interview_questions(role: str) -> dict:
    prompt = f"""
    You are a technical interviewer conducting a real-time viva/oral interview.
    Generate 10 SHORT, DIRECT, and SHARP interview questions strictly for the role: "{role[:100]}".

    CRITICAL RULES:
    1. Provide exactly 10 questions.
    2. Each question MUST be strictly 1 sentence (maximum 15-20 words).
    3. No long background stories, no complex scenarios, and no multi-part questions.
    4. Direct viva style: Ask about core concepts, internal mechanics, real-world trade-offs, or best practices specific to {role[:100]}.
    
    RESPOND ONLY WITH RAW JSON. NO MARKDOWN, NO BACKTICKS:
    {{
      "questions": [
        "Question 1",
        "Question 2",
        "Question 3",
        "Question 4",
        "Question 5",
        "Question 6",
        "Question 7",
        "Question 8",
        "Question 9",
        "Question 10"
      ]
    }}
    """.strip()
    
    raw = ask_multimodal_ai(prompt, json_mode=True, temperature=0.7)
    parsed = _extract_json_block(raw)
    questions = parsed.get("questions", []) if isinstance(parsed, dict) else parsed
    return {"questions": [str(q).strip() for q in questions if str(q).strip()][:10]}

def evaluate_interview_answers(qa_list: list) -> list:
    prompt = f"""
Evaluate the candidate's interview responses:
{json.dumps(qa_list[:10], indent=2)}

Return STRICT JSON:
{{
  "evaluations": [
    {{
      "question": "<question>",
      "answer": "<candidate answer>",
      "score": <0-100>,
      "feedback": "<concise constructive critique>",
      "suggestion": "<ideal answer recommendation>"
    }}
  ]
}}
""".strip()
    raw = ask_multimodal_ai(prompt, json_mode=True)
    parsed = _extract_json_block(raw)
    evals = parsed.get("evaluations", []) if isinstance(parsed, dict) else parsed
    return evals if isinstance(evals, list) else []

def generate_hr_email(
    company: str, 
    job_title: str, 
    email_type: str, 
    candidate_name: str = "Candidate", 
    skills=None,
    portfolio_url: str = "",
    linkedin_url: str = "",
    github_url: str = "",
    tone: str = "Professional"
) -> dict:
    if isinstance(skills, str):
        skills_list = [s.strip() for s in skills.split(",") if s.strip()]
    elif isinstance(skills, list):
        skills_list = [str(s).strip() for s in skills if str(s).strip()]
    else:
        skills_list = []

    skills_cleaned = [s for s in skills_list if s.lower() not in ["professional", "casual", "enthusiastic"]]
    skills_formatted = ", ".join(skills_cleaned) if skills_cleaned else "modern software engineering standards"

    footer_links = []
    if portfolio_url and portfolio_url.strip():
        footer_links.append(f"Portfolio: {portfolio_url.strip()}")
    if linkedin_url and linkedin_url.strip():
        footer_links.append(f"LinkedIn: {linkedin_url.strip()}")
    if github_url and github_url.strip():
        footer_links.append(f"GitHub: {github_url.strip()}")

    signature_block = f"Best regards,\n{candidate_name}"
    if footer_links:
        signature_block += "\n" + "\n".join(footer_links)

    prompt = f"""
    You are an elite Tech Career Advisor.
    Write a MEDIUM-LENGTH, punchy, professional email for:
    - Candidate: {candidate_name}
    - Company: {company}
    - Target Role: {job_title}
    - Objective: {email_type}
    - Technical Skills: {skills_formatted}

    CRITICAL LENGTH & CONTEXT RULES:
    1. KEEP IT MEDIUM LENGTH: Exactly 2 to 3 concise paragraphs (Strictly between 70 to 110 words total).
    2. NO FLUFF: Cut out unnecessary pleasantries. Get straight to the point with impact.
    3. ZERO placeholders or brackets (DO NOT use [Date], [Link], [Project], or brackets).
    4. Start directly with "Dear Hiring Team,\n\n" or "Dear Hiring Manager,\n\n".
    5. Seamlessly weave in the skills ({skills_formatted}) in just ONE focused sentence.
    6. Stop right before the sign-off; DO NOT write "Best regards" or candidate signature.

    RESPOND ONLY WITH VALID RAW JSON:
    {{
      "subject": "Clear Short Subject Line",
      "body": "Paragraph 1\\n\\nParagraph 2"
    }}
    """.strip()

    subject = f"{email_type}: {job_title} - {candidate_name}"
    body = (
        f"Dear Hiring Team,\n\n"
        f"Thank you for the conversation regarding the {job_title} role at {company}. "
        f"I really appreciated learning more about your engineering team's current challenges and technical goals.\n\n"
        f"Given my hands-on background with {skills_formatted}, I am confident in my ability to hit the ground running and add immediate value to your projects.\n\n"
        f"Please let me know if you need any additional details. I look forward to hearing about the next steps."
    )

    try:
        raw = ask_multimodal_ai(prompt, json_mode=True, temperature=0.5)
        parsed = _extract_json_block(raw)
        
        ai_subject = parsed.get("subject", "").strip()
        ai_body = parsed.get("body", "").strip()

        if ai_subject:
            subject = ai_subject
        if ai_body and "[" not in ai_body:
            clean_body = re.split(r"(Best regards|Sincerely|Thanks & regards)", ai_body, flags=re.IGNORECASE)[0].strip()
            body = clean_body
    except Exception:
        pass

    final_email_body = f"{body}\n\n{signature_block}"

    return {
        "subject": subject,
        "body": final_email_body
    }