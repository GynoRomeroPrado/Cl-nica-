from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import numpy as np

app = FastAPI(
    title="Health & Fitness ML Service",
    description="Machine Learning microservice for workout recommendations and predictions",
    version="1.0.0"
)

# Models
class WorkoutRecommendationRequest(BaseModel):
    user_id: str
    exercise_id: str
    goal: str  # 'strength', 'hypertrophy', 'endurance'
    recent_sessions: List[dict]

class WorkoutRecommendationResponse(BaseModel):
    weight_kg: float
    target_reps: int
    sets: int
    rest_sec: int
    notes: Optional[str] = None

class InjuryRiskRequest(BaseModel):
    user_id: str
    workouts_7d_volume: float
    workouts_28d_volume: float

class InjuryRiskResponse(BaseModel):
    risk: str  # 'LOW', 'MODERATE', 'HIGH', 'OPTIMAL'
    acwr: float
    acute_load: float
    chronic_load: float
    recommendation: str
    color: str

# Endpoints
@app.get("/")
async def root():
    return {"message": "Health & Fitness ML Service", "status": "online"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/workout-recommendation", response_model=WorkoutRecommendationResponse)
async def get_workout_recommendation(request: WorkoutRecommendationRequest):
    """
    Calculate next workout parameters using progressive overload
    """
    # Simplified logic - to be replaced with actual ML model
    params = {
        'strength': {'rep_range': (1, 5), 'rest_sec': 180, 'sets': 5},
        'hypertrophy': {'rep_range': (6, 12), 'rest_sec': 90, 'sets': 4},
        'endurance': {'rep_range': (15, 25), 'rest_sec': 45, 'sets': 3}
    }

    p = params.get(request.goal, params['hypertrophy'])

    if not request.recent_sessions:
        # First workout - estimate starting weight
        return WorkoutRecommendationResponse(
            weight_kg=20.0,
            target_reps=p['rep_range'][1],
            sets=p['sets'],
            rest_sec=p['rest_sec'],
            notes="First workout - starting conservatively"
        )

    # Calculate average from recent sessions
    avg_weight = np.mean([s.get('weight_kg', 0) for s in request.recent_sessions])
    avg_reps = np.mean([s.get('reps', 0) for s in request.recent_sessions])
    avg_rir = np.mean([s.get('reps_in_reserve', 3) for s in request.recent_sessions])

    # Progressive overload logic
    if avg_rir <= 2 and avg_reps >= p['rep_range'][1]:
        # Increase weight
        new_weight = avg_weight * 1.025
        new_reps = p['rep_range'][0]
        notes = "Increasing weight - great progress!"
    elif avg_reps < p['rep_range'][0]:
        # Decrease weight
        new_weight = avg_weight * 0.95
        new_reps = p['rep_range'][0]
        notes = "Reducing weight to maintain form"
    else:
        # Increase reps
        new_weight = avg_weight
        new_reps = int(avg_reps) + 1
        notes = "Progressing reps"

    return WorkoutRecommendationResponse(
        weight_kg=round(new_weight * 2) / 2,  # Round to nearest 0.5kg
        target_reps=new_reps,
        sets=p['sets'],
        rest_sec=p['rest_sec'],
        notes=notes
    )

@app.post("/injury-risk", response_model=InjuryRiskResponse)
async def calculate_injury_risk(request: InjuryRiskRequest):
    """
    Calculate injury risk using Acute:Chronic Workload Ratio (ACWR)
    """
    acute_load = request.workouts_7d_volume / 7
    chronic_load = request.workouts_28d_volume / 28

    if chronic_load == 0:
        return InjuryRiskResponse(
            risk="INSUFFICIENT_DATA",
            acwr=0.0,
            acute_load=acute_load,
            chronic_load=chronic_load,
            recommendation="Not enough data to assess injury risk",
            color="gray"
        )

    acwr = acute_load / chronic_load

    if acwr > 1.5:
        risk = "HIGH"
        recommendation = "Reduce training volume by 30-40% this week"
        color = "red"
    elif acwr > 1.35:
        risk = "MODERATE"
        recommendation = "Monitor fatigue closely, consider lighter session"
        color = "orange"
    elif acwr < 0.8:
        risk = "UNDERTRAINING"
        recommendation = "You can safely increase training volume"
        color = "blue"
    else:
        risk = "OPTIMAL"
        recommendation = "Training load is well-balanced"
        color = "green"

    return InjuryRiskResponse(
        risk=risk,
        acwr=round(acwr, 2),
        acute_load=round(acute_load, 1),
        chronic_load=round(chronic_load, 1),
        recommendation=recommendation,
        color=color
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
