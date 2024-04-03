import pandas as pd
import json
import io
import tarfile
import pickle
import os
import joblib
import boto3
from io import BytesIO, StringIO
from sklearn import metrics


def model_fn(model_dir):
    model = joblib.load(os.path.join(model_dir, "model.joblib"))
    return model


def input_fn(request_body, request_content_type):
    if request_content_type == 'application/json':
        request_body = json.loads(request_body)
        inpVar = request_body['Input']
        return inpVar
    else:
        raise ValueError("This model only supports application/json input")


def predict_fn(input_data, model):
    prediction = model.predict(input_data)
    return prediction


def output_fn(prediction, accept):
    if accept == "application/json":
        return json.dumps(prediction.tolist()), accept
    else:
        raise ValueError("Accept header must be 'application/json'")