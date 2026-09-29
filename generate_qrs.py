import urllib.request
import os

base_url = "https://vera-petcare.com"
pages = {
    "QR_Home_AR": "/ar/",
    "QR_Shampoo_AR": "/ar/products/shampoo/",
    "QR_Spray_AR": "/ar/products/spray/",
    "QR_Powder_AR": "/ar/products/powder/",
    "QR_Deo_AR": "/ar/products/deo/"
}

output_dir = r"d:\New folder (3)\New folder\Vera_Website\QR_Codes"
os.makedirs(output_dir, exist_ok=True)

for name, path in pages.items():
    url = base_url + path
    api_url = f"https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data={urllib.parse.quote(url)}&margin=10"
    out_path = os.path.join(output_dir, f"{name}.png")
    
    print(f"Downloading {name}...")
    urllib.request.urlretrieve(api_url, out_path)

print("Done! QR codes generated.")
