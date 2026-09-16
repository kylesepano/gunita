# Scoring

Maximum base accuracy points: **10,000**. Maximum total per round: **12,000**. Maximum ten-round score: **120,000**.

| Challenge  | Accuracy (0–1)                                                                                    |
| ---------- | ------------------------------------------------------------------------------------------------- |
| Who / What | 1 for the correct selection; otherwise 0                                                          |
| Where      | `exp(-distanceKm / 650)`                                                                          |
| When       | `exp(-absoluteYearError / (displayedRange * 0.12))`                                               |
| Why        | `max(0, (correctSelections - incorrectSelections) / totalCorrectCauses)`                          |
| How        | Half correctly positioned items, half correctly ordered pairs; duplicate/unknown items score zero |

Scores clamp accuracy to 0–1, with nonfinite accuracy treated as zero. All bonuses scale by accuracy, so a completely incorrect answer earns no bonus.

- Difficulty: easy 0, medium 350, hard 700.
- Time: up to 500, declining linearly to zero over 60 seconds.
- Streak: 100 per prior consecutive correct round, capped at 500.
- No hint: 300 when unused.

Rounded base and bonuses are summed and capped at 12,000. The reveal shows every part of the breakdown. Final accuracy is the mean of round accuracies; category accuracy uses only rounds drawn in that category. Categories not drawn are labelled explicitly and excluded from best/weakest ranking.

Geographic decay is deliberately forgiving in the founding collection. Regional and event-specific calibration can later replace the global 650 km scale without changing the map component.
