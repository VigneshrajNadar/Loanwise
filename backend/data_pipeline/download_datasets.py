import kagglehub
import shutil
import os

def download_and_move_dataset(dataset_name, target_dir):
    print(f"Downloading {dataset_name}...")
    try:
        # Download latest version
        path = kagglehub.dataset_download(dataset_name)
        print(f"Path to dataset files in cache: {path}")
        
        # Move downloaded files to our project dataset folder
        for item in os.listdir(path):
            s = os.path.join(path, item)
            d = os.path.join(target_dir, item)
            if os.path.isdir(s):
                shutil.copytree(s, d, dirs_exist_ok=True)
            else:
                shutil.copy2(s, d)
        print(f"Successfully copied {dataset_name} to {target_dir}\n")
    except Exception as e:
        print(f"Error downloading {dataset_name}: {e}\n")

if __name__ == "__main__":
    # Ensure the target directory exists
    target_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../dataset'))
    os.makedirs(target_dir, exist_ok=True)
    
    datasets = [
        "khushikyad001/personal-finance-tracker-dataset",
        "ismetsemedov/personal-budget-transactions-dataset",
        "cankatsrc/financial-transactions-dataset",
        "uciml/default-of-credit-card-clients-dataset",
        "apoorvwatsky/bank-transaction-data"
    ]
    
    print(f"Target dataset directory: {target_dir}\n")
    
    for dataset in datasets:
        download_and_move_dataset(dataset, target_dir)
    
    print("All datasets downloaded and saved in the dataset folder.")
