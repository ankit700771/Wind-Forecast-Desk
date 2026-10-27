"""Composition root: the only place that knows which concrete classes are used."""
from dataclasses import dataclass
from datetime import date
from functools import lru_cache

from .breakdowns import (DailyBreakdown, HistogramBreakdown, HourOfDayBreakdown, LeadTimeBreakdown,
                         SeriesBreakdown)
from .decisions import DecisionDataBuilder, PriorDecisionsBandEstimator
from .metrics import MetricsCalculator
from .repositories import CsvWindRepository
from .selection import LatestBeforeCutoffSelector
from .services import AccuracyService, DecisionService


@dataclass(frozen=True)
class Settings:
    first_decision: date = date(2026, 1, 1)
    last_decision: date = date(2026, 1, 31)
    default_cutoff: str = "09:00"


@lru_cache
def get_settings() -> Settings:
    return Settings()


@lru_cache
def get_repository() -> CsvWindRepository:
    return CsvWindRepository()


@lru_cache
def get_decision_builder() -> DecisionDataBuilder:
    repo = get_repository()
    return DecisionDataBuilder(repo, repo, LatestBeforeCutoffSelector())


@lru_cache
def get_decision_service() -> DecisionService:
    repo, s = get_repository(), get_settings()
    band = PriorDecisionsBandEstimator(get_decision_builder(), s.first_decision, s.last_decision)
    return DecisionService(repo, repo, LatestBeforeCutoffSelector(), band)


@lru_cache
def get_accuracy_service() -> AccuracyService:
    repo, calc = get_repository(), MetricsCalculator()
    breakdowns = [SeriesBreakdown(), DailyBreakdown(calc), HourOfDayBreakdown(calc),
                  HistogramBreakdown(), LeadTimeBreakdown(calc)]
    return AccuracyService(repo, repo, get_decision_builder(), calc, breakdowns)
