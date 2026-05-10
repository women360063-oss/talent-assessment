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

for page in pages:
    if not os.path.exists(page):
        continue
    
    print(f'Fixing {page}...')
    
    with open(page, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace logo references
    content = content.replace('logo-new.jpg', 'logo.jpg')
    content = content.replace('logo-new.png', 'logo.jpg')
    content = content.replace('logo-final.png', 'logo.jpg')
    
    # Remove inline style from img tag
    content = content.replace(
        'style="width:40px;height:40px;max-width:40px;max-height:40px;object-fit:contain;border-radius:8px;"',
        ''
    )
    
    # Remove hamburger menu toggle HTML
    # Find and remove the nav-menu-toggle div
    import re
    content = re.sub(
        r'<div class="nav-menu-toggle"[^>]*>.*?</div>',
        '',
        content,
        flags=re.DOTALL
    )
    
    # Remove hamburger menu CSS
    content = re.sub(
        r'\.nav-menu-toggle\s*\{[^}]*\}',
        '',
        content
    )
    content = re.sub(
        r'\.nav-menu-toggle span\s*\{[^}]*\}',
        '',
        content
    )
    
    # Remove toggle function call from responsive CSS
    content = re.sub(
        r'\.nav-menu-toggle\s*\{[^}]*\}',
        '',
        content
    )
    
    with open(page, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f'Fixed {page}!')

print('All pages fixed!')
