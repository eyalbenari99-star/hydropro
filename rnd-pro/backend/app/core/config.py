import os
DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql+asyncpg://hnx:hnx@localhost/hnx')
R2_BUCKET = os.environ.get('R2_BUCKET', 'hnx-rnd')
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
