# ReviewLens baseline model

This model uses hashed word and bigram features with NumPy logistic regression.
`0` is treated as genuine/non-flagged and `1` as flagged/risk. Identity fields
are excluded. An uncertain probability band may be displayed as suspicious,
but suspicious is not a separately labeled class in the source data.
