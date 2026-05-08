import os
import re

files = [f for f in os.listdir('.') if f.endswith('.md')]

replacements = [
    (r'\b(A|a)qui\b', r'\1quí'),
    (r'\b(A|a)lli\b', r'\1llí'),
    (r'\b(A|a)si\b', r'\1sí'),
    (r'\b(T|t)ambien\b', r'\1ambién'),
    (r'\b(D|d)espues\b', r'\1espués'),
    (r'\b(A|a)demas\b', r'\1demás'),
    (r'\b(M|m)as\b(?=\s+que|\s+de)', r'\1ás'), # Not perfect, just an indicator
    (r'\b(I|i)ncreible\b', r'\1ncreíble'),
    (r'\b(F|f)acil\b', r'\1ácil'),
    (r'\b(D|d)ificil\b', r'\1ifícil'),
    (r'\b(U|u)til\b', r'\1til'), # útil
    (r'\b(A|a)plicacion\b', r'\1plicación'),
    (r'\b(I|i)nformacion\b', r'\1nformación'),
    (r'\b(O|o)pcion\b', r'\1pción'),
    (r'\b(R|r)eflexion\b', r'\1eflexión'),
    (r'\b(P|p)ublicacion\b', r'\1ublicación'),
    (r'\b(E|e)xplicacion\b', r'\1xplicación'),
    (r'\b(M|m)asificacion\b', r'\1asificación'),
    (r'\b(A|a)tencion\b', r'\1tención'),
    (r'\b(E|e)mocion\b', r'\1moción'),
    (r'\b(D|d)ecision\b', r'\1ecisión'),
    (r'\b(C|c)onexion\b', r'\1onexión'),
    (r'\b(P|p)as\b', r'\1aso'), # ?
    (r'\b(P|p)orque\b\s*\?', r'\1or qué?'), # "porque?" -> "por qué?"
    (r'¿\s*(q|Q)ue\b', r'¿\1ué'),
    (r'¿\s*(c|C)omo\b', r'¿\1ómo'),
    (r'¿\s*(c|C)uanto\b', r'¿\1uánto'),
    (r'¿\s*(c|C)uanta\b', r'¿\1uánta'),
    (r'¿\s*(c|C)uantos\b', r'¿\1uántos'),
    (r'¿\s*(c|C)uantas\b', r'¿\1uántas'),
    (r'¿\s*(c|C)uando\b', r'¿\1uándo'),
    (r'¿\s*(d|D)onde\b', r'¿\1ónde'),
    (r'¿\s*(p|P)or que\b', r'¿\1or qué'),
    (r'¿\s*(q|Q)uien\b', r'¿\1uién'),
    (r'¿\s*(c|C)ual\b', r'¿\1uál'),
]

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Missing opening marks
    # sentences like "Qué buena reflexión!" -> "¡Qué buena reflexión!"
    content = re.sub(r'(?<!¡)(?<!\[)(?<!\()([A-ZÁÉÍÓÚ][^.!?\n]+!)', r'¡\1', content)
    
    for old, new in replacements:
        content = re.sub(old, new, content)
        
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print("Done basic replacements.")
