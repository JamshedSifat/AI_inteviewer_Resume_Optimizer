from django.urls import path
from .views import ResumeAuditView, GenerateQuestionsView, EvaluateInterviewView,GenerateHREmailView

urlpatterns = [
    path('resume-audit/', ResumeAuditView.as_view(), name='resume-audit'),
    path('interview/questions/', GenerateQuestionsView.as_view(), name='generate-questions'),
    path('interview/evaluate/', EvaluateInterviewView.as_view(), name='evaluate-interview'),
    path('generate-email/', GenerateHREmailView.as_view(), name='generate-hr-email'),
]