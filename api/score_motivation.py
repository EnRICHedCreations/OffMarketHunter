from http.server import BaseHTTPRequestHandler
import json
from datetime import datetime, timedelta

def calculate_motivation_score(property_data, property_history=None, market_data=None):
    """
    Calculate motivation score 0-100

    Components:
    - 25% Days on Market
    - 30% Price Reductions
    - 20% Off-Market Duration
    - 15% Status Changes
    - 10% Market Conditions
    """
    if property_history is None:
        property_history = []
    if market_data is None:
        market_data = {}

    # Component 1: Days on Market (25 points)
    dom = property_data.get('days_on_market', 0)
    if dom is None:
        dom = 0

    if dom < 30:
        dom_score = 5
    elif dom < 60:
        dom_score = 10
    elif dom < 90:
        dom_score = 15
    elif dom < 120:
        dom_score = 20
    else:
        dom_score = 25  # 120+ days = max score

    # Component 2: Price Reductions (30 points)
    reduction_count = property_data.get('price_reduction_count', 0) or 0
    reduction_percent = property_data.get('total_price_reduction_percent', 0) or 0

    count_score = min(reduction_count * 7, 15)  # Max 15 points (2+ reductions)
    percent_score = min(reduction_percent * 0.75, 15)  # Max 15 points (20%+ reduction)
    reduction_score = count_score + percent_score

    # Component 3: Off-Market Duration (20 points)
    # Calculate days since property went off-market
    off_market_days = 0
    current_status = property_data.get('current_status', '').lower()

    if current_status in ['off_market', 'off market', 'withdrawn']:
        # Check if we have a list_date to calculate from
        list_date = property_data.get('list_date')
        if list_date:
            try:
                if isinstance(list_date, str):
                    list_dt = datetime.fromisoformat(list_date.replace('Z', '+00:00'))
                else:
                    list_dt = list_date
                off_market_days = (datetime.now() - list_dt).days
            except:
                off_market_days = 30  # Default to 30 days if can't calculate

    if off_market_days < 7:
        off_market_score = 20  # Fresh off-market = highest motivation
    elif off_market_days < 30:
        off_market_score = 15
    elif off_market_days < 90:
        off_market_score = 10
    else:
        off_market_score = 5  # Old off-market = less motivated

    # Component 4: Status Changes (15 points)
    status_score = 0

    # Check for failed pending/contingent in history
    for h in property_history:
        old_status = (h.get('old_status') or '').lower()
        new_status = (h.get('new_status') or '').lower()

        if old_status in ['pending', 'contingent'] and new_status in ['off_market', 'off market', 'withdrawn']:
            status_score += 10
            break

    # Check for expired listing
    if current_status == 'expired':
        status_score += 5

    status_score = min(status_score, 15)

    # Component 5: Market Conditions (10 points)
    # Compare property DOM to market average DOM
    market_avg_dom = market_data.get('avg_days_on_market', 60)

    if dom > market_avg_dom * 1.5:
        market_score = 10  # Way above average = highly motivated
    elif dom > market_avg_dom * 1.2:
        market_score = 7
    elif dom > market_avg_dom:
        market_score = 5
    else:
        market_score = 3

    # Total score
    total_score = (
        dom_score +
        reduction_score +
        off_market_score +
        status_score +
        market_score
    )

    return {
        'total': round(total_score, 2),
        'dom_component': round(dom_score, 2),
        'reduction_component': round(reduction_score, 2),
        'off_market_component': round(off_market_score, 2),
        'status_component': round(status_score, 2),
        'market_component': round(market_score, 2)
    }


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            property_data = data.get('property', {})
            property_history = data.get('history', [])
            market_data = data.get('market', {})

            score = calculate_motivation_score(property_data, property_history, market_data)

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            response = {
                'success': True,
                'score': score
            }

            self.wfile.write(json.dumps(response).encode())

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()

            response = {
                'success': False,
                'error': str(e)
            }

            self.wfile.write(json.dumps(response).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
