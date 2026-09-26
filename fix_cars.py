import os

def fix_driver_controller():
    filepath = r"d:\kiaan\Hero_Logistic\Hero-Logistic-Clone\backend\src\controllers\DriverPortalController.js"
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace include: { cars: true } with include: { itemMovements: true }
    content = content.replace("include: { cars: true }", "include: { itemMovements: true }")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("Fixed cars -> itemMovements!")

if __name__ == "__main__":
    fix_driver_controller()
