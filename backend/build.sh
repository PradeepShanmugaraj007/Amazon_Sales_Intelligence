#!/bin/bash
# Render Build Script — installs dependencies and initializes the database
pip install -r requirements.txt
python init_db.py
