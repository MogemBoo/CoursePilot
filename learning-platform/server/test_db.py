from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, OperationFailure

# -----------------------------------------------------------------------
# PASTE YOUR CONNECTION STRING BELOW
# Example (Short): "mongodb+srv://user:pass@cluster0..."
# Example (Long):  "mongodb://cluster0-shard-00-00..." (Use this if WiFi blocks you)
# -----------------------------------------------------------------------
uri = "mongodb+srv://admin:admin@cluster0.spmmxwe.mongodb.net/?appName=Cluster0" 

print("⏳ Attempting to connect to MongoDB Atlas...")

try:
    # 1. Connect to the Cluster
    client = MongoClient(uri)
    
    # 2. Force a call to the server to check if it's actually there
    # The 'ping' command is lightweight and confirms the network path is open
    client.admin.command('ping')
    print("✅ CONNECTION SUCCESSFUL!")
    print("-" * 30)

    # 3. Get Server Status & Information
    # This retrieves the actual build info from the database engine
    server_info = client.server_info()
    
    print(f"📊 DATABASE STATUS REPORT:")
    print(f"   • Version:      {server_info.get('version')}")
    print(f"   • Git Hash:     {server_info.get('gitVersion')}")
    print(f"   • OS Type:      {server_info.get('sysInfo')}")
    print(f"   • 64-bit:       {server_info.get('bits')} bit")
    
    # 4. List Existing Databases
    # This proves you have permission to read data
    dbs = client.list_database_names()
    print("-" * 30)
    print(f"📂 EXISTING DATABASES ({len(dbs)}):")
    for db in dbs:
        print(f"   - {db}")

except ConnectionFailure:
    print("❌ CONNECTION FAILED: Could not reach the server.")
    print("   Tip: Check your WiFi, or try the 'Long' connection string.")
except OperationFailure as e:
    print("❌ AUTHENTICATION FAILED: Wrong username or password.")
    print(f"   Details: {e}")
except Exception as e:
    print(f"❌ AN ERROR OCCURRED: {e}")