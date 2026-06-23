# AI-Based House Price Prediction - Chennai Dataset
import os
import pandas as pd
import numpy as np
import pickle

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# Paths
DATA_DIR = "data"
CSV_PATH = os.path.join(DATA_DIR, "Chennai housing sale.csv")
MODEL_PATH = os.path.join(DATA_DIR, "model.pkl")


def clean_data(df):
    print("Dataset columns:", df.columns.tolist())

    # Fill missing values
    df['N_BEDROOM'] = df['N_BEDROOM'].fillna(df['N_BEDROOM'].mode()[0])
    df['N_BATHROOM'] = df['N_BATHROOM'].fillna(df['N_BATHROOM'].mode()[0])

    # LOCATION cleaning (IMPORTANT FIX)
    df['LOCATION'] = df['LOCATION'].astype(str).str.strip().str.lower()

    # Convert dates
    df['DATE_BUILD'] = pd.to_datetime(df['DATE_BUILD'], errors='coerce')
    df['DATE_SALE'] = pd.to_datetime(df['DATE_SALE'], errors='coerce')

    # Property Age
    df['PROPERTY_AGE'] = df['DATE_SALE'].dt.year - df['DATE_BUILD'].dt.year
    df['PROPERTY_AGE'] = df['PROPERTY_AGE'].fillna(df['PROPERTY_AGE'].median())

    return df


def train_model():
    # Load dataset
    df = pd.read_csv(CSV_PATH)

    df = clean_data(df)

    # Categorical columns
    categorical_cols = ['LOCATION', 'PARK_FACIL', 'BUILDTYPE', 'UTILITY_AVAIL', 'STREET', 'MZZONE']

    mappings = {}

    for col in categorical_cols:
        df[col] = df[col].astype(str).str.lower()
        unique_vals = df[col].unique()
        mappings[col] = {val: idx for idx, val in enumerate(unique_vals)}
        df[col] = df[col].map(mappings[col])

    # Features & Target
    features = [
        'LOCATION',
        'INT_SQFT',
        'N_BEDROOM',
        'N_BATHROOM',
        'PARK_FACIL',
        'BUILDTYPE',
        'UTILITY_AVAIL',
        'STREET',
        'MZZONE',
        'PROPERTY_AGE'
    ]

    target = 'SALES_PRICE'

    X = df[features]
    y = df[target]

    # Fill missing
    X = X.fillna(0)
    y = y.fillna(y.median())

    # Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # Model
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=12,
        random_state=42
    )

    model.fit(X_train, y_train)

    # Prediction
    y_pred = model.predict(X_test)

    # Metrics
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)

    print("\n===== MODEL PERFORMANCE =====")
    print("MAE  :", mae)
    print("RMSE :", rmse)
    print("R2   :", r2)
    print("=============================\n")

    # Save model
    model_data = {
        "model": model,
        "features": features,
        "mappings": mappings
    }

    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model_data, f)

    print("Model saved successfully!")


if __name__ == "__main__":
    train_model()