from setuptools import setup, find_packages

setup(
    name="mlang",
    version="1.0.0",
    description="MLang - Roman Marathi programming language interpreter and compiler",
    packages=find_packages(),
    entry_points={
        'console_scripts': [
            'mlang = mlang.mlang:main',
            'mlangc = mlang.mlangc:main',
        ]
    },
    python_requires='>=3.6',
)
