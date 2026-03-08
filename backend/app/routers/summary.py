from fastapi import APIRouter, HTTPException
from app.db import SessionDep
from sqlmodel import select
from app.models import Agreement, Summary

router = APIRouter(prefix="/summary", tags=["summary"])


@router.get("/{company_name}")
def get_summary(
    company_name: str, session: SessionDep, agreement_type: str | None = None
):
    try:
        query = select(Agreement).where(Agreement.company_name == company_name)

        if agreement_type:
            query = query.where(Agreement.agreement_type == agreement_type)

        agreement = session.exec(query).first()

        if not agreement:
            raise HTTPException(
                status_code=404, detail=f"No agreement found for {company_name}"
            )

        summaries = session.exec(
            select(Summary)
            .where(Summary.agreement_id == agreement.id)
            .order_by(Summary.question_id)
        ).all()

        return {
            "questions": [s.question.text for s in summaries],
            "answers": [
                {
                    "summary_text": s.summary_text,
                    "concern_level": s.concern_level,
                    "quote": s.quote,
                }
                for s in summaries
            ],
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to find summary: {str(e)}")
