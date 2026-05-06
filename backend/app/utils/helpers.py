def is_float(value):
    try:
        float(value)
        return True
    except (ValueError, TypeError):
        return False

def safe_float(val):
    if not val:
        return 0.0
    try:
        return float(str(val).replace(',', '').strip())
    except:
        return 0.0
