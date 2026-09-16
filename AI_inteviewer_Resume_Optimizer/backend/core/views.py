import io
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .utils import (
    extract_text_from_pdf,
    check_ats_formatting_compliance,
    analyze_resume_with_ai,
    generate_interview_questions,
    evaluate_interview_answers,
    generate_hr_email
)


class ResumeAuditView(APIView):
    def post(self, request):
        pdf_file = request.FILES.get("resume")
        job_description = request.data.get("job_description", "").strip()

        if not pdf_file:
            return Response(
                {"error": "Please upload a resume PDF file."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not job_description:
            return Response(
                {"error": "Please provide the target job description."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            
            file_bytes = io.BytesIO(pdf_file.read())
            resume_text = extract_text_from_pdf(file_bytes)
            
            file_bytes.seek(0)
            technical_compliance = check_ats_formatting_compliance(file_bytes, resume_text)

           
            ai_analysis = analyze_resume_with_ai(resume_text, job_description)

            
            combined_report = {
                **ai_analysis,
                "atsCompliance": technical_compliance,
            }
            return Response(combined_report, status=status.HTTP_200_OK)

        except ValueError as val_err:
            return Response({"error": str(val_err)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as err:
            return Response(
                {"error": f"Failed to analyze resume: {str(err)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class GenerateQuestionsView(APIView):
    def post(self, request):
        role = request.data.get("role", "").strip()
        if not role:
            return Response(
                {"error": "Target role is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            data = generate_interview_questions(role)
            return Response(data, status=status.HTTP_200_OK)
        except Exception as err:
            return Response(
                {"error": f"Failed to generate questions: {str(err)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class EvaluateInterviewView(APIView):

    def post(self, request):
        qa_list = request.data.get("qa_list", [])
        if not qa_list or not isinstance(qa_list, list):
            return Response(
                {"error": "A list of question-answer pairs is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            evaluations = evaluate_interview_answers(qa_list)
            return Response({"evaluations": evaluations}, status=status.HTTP_200_OK)
        except Exception as err:
            return Response(
                {"error": f"Failed to evaluate answers: {str(err)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

class GenerateHREmailView(APIView):
    def post(self, request):
        company = request.data.get("company", "").strip()
        job_title = request.data.get("job_title", "").strip()
        candidate_name = request.data.get("candidate_name") or request.data.get("candidateName") or "Candidate"
        email_type = request.data.get("email_type") or request.data.get("emailType") or "Follow-up"
        skills = request.data.get("skills", [])
        
        
        portfolio_url = (request.data.get("portfolio_url") or request.data.get("portfolioUrl") or "").strip()
        linkedin_url = (request.data.get("linkedin_url") or request.data.get("linkedinUrl") or "").strip()
        github_url = (request.data.get("github_url") or request.data.get("githubUrl") or "").strip()
        tone = request.data.get("tone", "Professional").strip()

        if not company or not job_title:
            return Response(
                {"error": "Both Company Name and Job Title are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            result = generate_hr_email(
                company=company,
                job_title=job_title,
                email_type=email_type,
                candidate_name=candidate_name.strip(),
                skills=skills,
                portfolio_url=portfolio_url,
                linkedin_url=linkedin_url,
                github_url=github_url,
                tone=tone
            )
            return Response(result, status=status.HTTP_200_OK)
        except Exception as err:
            return Response(
                {"error": f"Failed to generate email: {str(err)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )