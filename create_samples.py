import os
from PIL import Image, ImageDraw

def create_sample_images():
    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'samples')
    os.makedirs(output_dir, exist_ok=True)
    
    # 7 waste categories samples configuration
    # (Filename, Background Color, Centered Text)
    samples = [
        ('plastic_bottle.png', '#10b981', 'PLASTIC BOTTLE\n(Recyclable Waste)'),
        ('paper_box.png', '#3b82f6', 'CARDBOARD BOX\n(Paper Waste)'),
        ('glass_jar.png', '#6366f1', 'GLASS JAR\n(Glass Waste)'),
        ('metal_can.png', '#8b5cf6', 'METAL CAN\n(Metal Waste)'),
        ('organic_food.png', '#f59e0b', 'BANANA PEEL\n(Organic Waste)'),
        ('ewaste_keyboard.png', '#0ea5e9', 'KEYBOARD / PHONE\n(E-Waste)'),
        ('hazardous_battery.png', '#ef4444', 'CELL BATTERY\n(Hazardous Waste)')
    ]
    
    print(f"Generating test sample images in: {output_dir}")
    
    for filename, color_hex, text in samples:
        filepath = os.path.join(output_dir, filename)
        
        # Create a new RGB image
        img = Image.new('RGB', (400, 400), color=color_hex)
        draw = ImageDraw.Draw(img)
        
        # Draw a nice clean card design inside the image
        draw.rectangle([20, 20, 380, 380], outline='#ffffff', width=4)
        
        # Simple crosshairs/recycling emblem representation
        draw.line([190, 80, 210, 80], fill='#ffffff', width=3)
        draw.line([200, 70, 200, 90], fill='#ffffff', width=3)
        
        # Write centered text
        # Since standard PIL default font doesn't support easy scaling/line breaks out of the box,
        # we draw the lines manually or split them.
        lines = text.split('\n')
        y_offset = 160
        for line in lines:
            # simple text drawing (fallback default font is small but readable)
            draw.text((80, y_offset), line, fill='#ffffff')
            y_offset += 40
            
        img.save(filepath)
        print(f"Created sample: {filename}")

if __name__ == '__main__':
    create_sample_images()
