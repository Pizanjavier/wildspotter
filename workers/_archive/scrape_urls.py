import requests
import re
from xml.etree import ElementTree

urls = [
    "https://www.miteco.gob.es/es/biodiversidad/servicios/banco-datos-naturaleza/informacion-disponible/red_natura_2000_inf_disp.html",
    "https://www.miteco.gob.es/es/biodiversidad/servicios/banco-datos-naturaleza/informacion-disponible/espacios_nat_proteg_inf_disp.html",
    "https://www.miteco.gob.es/es/cartografia-y-sig/ide/descargas/costas-medio-marino/deslinde-dpmt.aspx"
]

for url in urls:
    try:
        res = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
        zips = list(set(re.findall(r'href="([^"]+\.zip)"', res.text)))
        print(f"Results for {url}:")
        for z in zips:
            print("- " + z)
        print()
    except Exception as e:
        print(f"Error for {url}: {e}")
