import random

class BankScraperService:
    @staticmethod
    def get_real_time_offers(purpose="other", credit_score=700):
        """
        Mock scraper service based on March 2026 market research.
        Returns top 10 matched bank offers based on loan type and credit tier.
        """
        
        # Comprehensive bank repository with real-world 2026 rates
        bank_repository = [
            {"name": "HDFC Bank", "min_rate": 9.99, "max_rate": 24.0, "tenure": "12-60", "max_limit": "50L", "min_score": 750, "url": "https://www.hdfcbank.com", "category": ["debt_consolidation", "major_purchase", "other", "vacation"]},
            {"name": "ICICI Bank", "min_rate": 10.75, "max_rate": 22.0, "tenure": "12-48", "max_limit": "40L", "min_score": 720, "url": "https://www.icicibank.com", "category": ["credit_card", "car", "bike", "medical", "vacation"]},
            {"name": "SBI", "min_rate": 10.30, "max_rate": 15.30, "tenure": "12-84", "max_limit": "1Cr", "min_score": 760, "url": "https://www.sbi.co.in", "category": ["home_improvement", "house", "education"]},
            {"name": "Axis Bank", "min_rate": 10.49, "max_rate": 21.55, "tenure": "12-72", "max_limit": "45L", "min_score": 740, "url": "https://www.axisbank.com", "category": ["debt_consolidation", "wedding", "vacation"]},
            {"name": "Kotak Mahindra", "min_rate": 9.98, "max_rate": 18.0, "tenure": "12-60", "max_limit": "30L", "min_score": 700, "url": "https://www.kotak.com", "category": ["small_business", "wedding", "other"]},
            {"name": "IDFC FIRST", "min_rate": 9.99, "max_rate": 20.0, "tenure": "12-60", "max_limit": "40L", "min_score": 710, "url": "https://www.idfcfirstbank.com", "category": ["bike", "other", "vacation"]},
            {"name": "Bandhan Bank", "min_rate": 9.47, "max_rate": 16.0, "tenure": "12-60", "max_limit": "15L", "min_score": 650, "url": "https://www.bandhanbank.com", "category": ["small_business", "medical", "other"]},
            {"name": "Bank of Baroda", "min_rate": 10.15, "max_rate": 18.75, "tenure": "12-60", "max_limit": "20L", "min_score": 730, "url": "https://www.bankofbaroda.in", "category": ["car", "bike", "education"]},
            {"name": "Standard Chartered", "min_rate": 10.25, "max_rate": 19.99, "tenure": "12-60", "max_limit": "50L", "min_score": 750, "url": "https://www.sc.com/in", "category": ["credit_card", "medical", "vacation"]},
            {"name": "Bajaj Finserv", "min_rate": 10.00, "max_rate": 31.0, "tenure": "12-60", "max_limit": "40L", "min_score": 710, "url": "https://www.bajajfinserv.in", "category": ["bike", "other", "medical", "major_purchase"]},
            {"name": "Tata Capital", "min_rate": 10.99, "max_rate": 29.99, "tenure": "12-72", "max_limit": "35L", "min_score": 720, "url": "https://www.tatacapital.com", "category": ["home_improvement", "wedding", "bike"]},
            {"name": "IndusInd Bank", "min_rate": 10.49, "max_rate": 26.0, "tenure": "12-60", "max_limit": "30L", "min_score": 700, "url": "https://www.indusind.com", "category": ["major_purchase", "vacation", "wedding"]},
            {"name": "HSBC India", "min_rate": 9.95, "max_rate": 17.50, "tenure": "12-48", "max_limit": "30L", "min_score": 750, "url": "https://www.hsbc.co.in", "category": ["debt_consolidation", "house"]},
            {"name": "Canara Bank", "min_rate": 9.70, "max_rate": 15.15, "tenure": "12-60", "max_limit": "10L", "min_score": 740, "url": "https://canarabank.com", "category": ["car", "bike", "education"]},
            {"name": "Federal Bank", "min_rate": 11.49, "max_rate": 14.49, "tenure": "12-48", "max_limit": "25L", "min_score": 680, "url": "https://www.federalbank.co.in", "category": ["small_business", "education"]}
        ]

        # Filter: Credit Score Match (with 40 point buffer)
        eligible = [b for b in bank_repository if credit_score >= b['min_score'] - 40]

        # Scoring Logic:
        # 1. Matches Category (Loan Type) -> Priority
        # 2. Lowest Min Rate -> Stability
        def calculate_rank(bank):
            category_match = 0 if purpose in bank['category'] else 1
            rate_score = bank['min_rate']
            return (category_match, rate_score)

        eligible.sort(key=calculate_rank)

        # Truncate to top 10 and format for frontend
        top_10 = []
        for b in eligible[:10]:
            top_10.append({
                "name": b['name'],
                "rate": f"{b['min_rate']}%",
                "tenure": b['tenure'],
                "max": b['max_limit'],
                "url": b['url'],
                "is_match": purpose in b['category']
            })

        return top_10
