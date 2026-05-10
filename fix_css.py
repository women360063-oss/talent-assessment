import os

pages = [
    'index.html',
    'soulight.html', 
    'about.html',
    'bali-retreat.html',
    'journal.html',
    'partners.html',
    'retreats.html'
]

css_to_add = '''
        .nav-logo img {
            width: 40px;
            height: 40px;
            object-fit: contain;
            border-radius: 8px;
        }
'''

for page in pages:
    if not os.path.exists(page):
        continue
    
    print(f'Fixing CSS in {page}...')
    
    with open(page, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find .nav-logo section and add the img style after it
    old_nav_logo = '''        .nav-logo {
            display: flex;
            align-items: center;
            gap: 10px;
            font-family: 'Noto Serif SC', serif;
            font-size: 20px;
            font-weight: 600;
            color: var(--dark);
        }
'''
    
    new_nav_logo = '''        .nav-logo {
            display: flex;
            align-items: center;
            gap: 10px;
            font-family: 'Noto Serif SC', serif;
            font-size: 20px;
            font-weight: 600;
            color: var(--dark);
        }

        .nav-logo img {
            width: 40px;
            height: 40px;
            object-fit: contain;
            border-radius: 8px;
        }
'''
    
    if old_nav_logo in content:
        content = content.replace(old_nav_logo, new_nav_logo)
    else:
        # Try to find with different spacing
        import re
        content = re.sub(
            r'(\.nav-logo\s*\{[^}]*\})',
            r'\1\n\n        .nav-logo img {\n            width: 40px;\n            height: 40px;\n            object-fit: contain;\n            border-radius: 8px;\n        }',
            content
        )
    
    with open(page, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f'Fixed {page}!')

print('All pages CSS fixed!')
