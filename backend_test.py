#!/usr/bin/env python3
"""
Comprehensive Backend Testing for MoodNest App
Tests authentication, mood entries, statistics, AI predictions, and data export
"""

import requests
import json
import time
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://react-mood-clone.preview.emergentagent.com/api"
TEST_USER_EMAIL = "sarah.wellness@example.com"
TEST_USER_PASSWORD = "SecurePass123!"
TEST_USER_NAME = "Sarah Wellness"

class MoodNestTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.auth_token = None
        self.user_id = None
        self.test_results = []
        self.mood_entry_ids = []
        
    def log_test(self, test_name: str, success: bool, message: str, details: Any = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None) -> requests.Response:
        """Make HTTP request with proper error handling"""
        url = f"{self.base_url}{endpoint}"
        default_headers = {"Content-Type": "application/json"}
        
        if self.auth_token:
            default_headers["Authorization"] = f"Bearer {self.auth_token}"
        
        if headers:
            default_headers.update(headers)
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=default_headers, timeout=30)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, headers=default_headers, timeout=30)
            elif method.upper() == "PUT":
                response = requests.put(url, json=data, headers=default_headers, timeout=30)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=default_headers, timeout=30)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            raise
    
    def test_user_registration(self):
        """Test user registration"""
        print("\n=== Testing User Registration ===")
        
        # Test successful registration
        registration_data = {
            "name": TEST_USER_NAME,
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        }
        
        try:
            response = self.make_request("POST", "/auth/register", registration_data)
            
            if response.status_code == 201 or response.status_code == 200:
                data = response.json()
                if "token" in data and "user" in data:
                    self.auth_token = data["token"]
                    self.user_id = data["user"]["id"]
                    self.log_test("User Registration", True, "Successfully registered new user")
                else:
                    self.log_test("User Registration", False, "Missing token or user in response", data)
            elif response.status_code == 400 and "already registered" in response.text:
                # User already exists, try to login instead
                self.log_test("User Registration", True, "User already exists (expected)")
                self.test_user_login()
            else:
                self.log_test("User Registration", False, f"Registration failed with status {response.status_code}", response.text)
        except Exception as e:
            self.log_test("User Registration", False, f"Registration request failed: {str(e)}")
    
    def test_user_login(self):
        """Test user login"""
        print("\n=== Testing User Login ===")
        
        # Test successful login
        login_data = {
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        }
        
        try:
            response = self.make_request("POST", "/auth/login", login_data)
            
            if response.status_code == 200:
                data = response.json()
                if "token" in data and "user" in data:
                    self.auth_token = data["token"]
                    self.user_id = data["user"]["id"]
                    self.log_test("User Login - Valid Credentials", True, "Successfully logged in")
                else:
                    self.log_test("User Login - Valid Credentials", False, "Missing token or user in response", data)
            else:
                self.log_test("User Login - Valid Credentials", False, f"Login failed with status {response.status_code}", response.text)
        except Exception as e:
            self.log_test("User Login - Valid Credentials", False, f"Login request failed: {str(e)}")
        
        # Test invalid credentials
        invalid_login_data = {
            "email": TEST_USER_EMAIL,
            "password": "wrongpassword"
        }
        
        try:
            response = self.make_request("POST", "/auth/login", invalid_login_data)
            
            if response.status_code == 401:
                self.log_test("User Login - Invalid Credentials", True, "Correctly rejected invalid credentials")
            else:
                self.log_test("User Login - Invalid Credentials", False, f"Should have returned 401, got {response.status_code}")
        except Exception as e:
            self.log_test("User Login - Invalid Credentials", False, f"Invalid login test failed: {str(e)}")
    
    def test_protected_endpoints_without_token(self):
        """Test accessing protected endpoints without authentication"""
        print("\n=== Testing Protected Endpoints Without Token ===")
        
        # Temporarily remove token
        temp_token = self.auth_token
        self.auth_token = None
        
        protected_endpoints = [
            ("GET", "/auth/me"),
            ("GET", "/moods"),
            ("POST", "/moods"),
            ("GET", "/moods/stats"),
            ("POST", "/predictions/generate")
        ]
        
        for method, endpoint in protected_endpoints:
            try:
                if method == "POST" and endpoint == "/moods":
                    # Need some data for mood creation
                    data = {"mood_value": 3, "mood_emoji": "😐", "mood_color": "#FFA500", "factors": {"sleep": 3, "stress": 3, "energy": 3}}
                    response = self.make_request(method, endpoint, data)
                else:
                    response = self.make_request(method, endpoint)
                
                if response.status_code == 401:
                    self.log_test(f"Protected Access - {method} {endpoint}", True, "Correctly rejected unauthorized access")
                else:
                    self.log_test(f"Protected Access - {method} {endpoint}", False, f"Should have returned 401, got {response.status_code}")
            except Exception as e:
                self.log_test(f"Protected Access - {method} {endpoint}", False, f"Request failed: {str(e)}")
        
        # Restore token
        self.auth_token = temp_token
    
    def test_protected_endpoints_with_token(self):
        """Test accessing protected endpoints with valid token"""
        print("\n=== Testing Protected Endpoints With Valid Token ===")
        
        if not self.auth_token:
            self.log_test("Protected Access With Token", False, "No auth token available")
            return
        
        try:
            response = self.make_request("GET", "/auth/me")
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and "email" in data:
                    self.log_test("Protected Access With Token", True, "Successfully accessed protected endpoint")
                else:
                    self.log_test("Protected Access With Token", False, "Invalid user data structure", data)
            else:
                self.log_test("Protected Access With Token", False, f"Failed to access protected endpoint: {response.status_code}")
        except Exception as e:
            self.log_test("Protected Access With Token", False, f"Protected endpoint test failed: {str(e)}")
    
    def test_mood_entry_creation(self):
        """Test mood entry creation"""
        print("\n=== Testing Mood Entry Creation ===")
        
        if not self.auth_token:
            self.log_test("Mood Entry Creation", False, "No auth token available")
            return
        
        # Test complete mood entry
        complete_mood_data = {
            "mood_value": 4,
            "mood_emoji": "😊",
            "mood_color": "#4CAF50",
            "factors": {
                "sleep": 4,
                "stress": 2,
                "energy": 4
            },
            "journal_text": "Had a great day at work! Feeling productive and energized. The morning meditation really helped set a positive tone."
        }
        
        try:
            response = self.make_request("POST", "/moods", complete_mood_data)
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and "mood_value" in data:
                    self.mood_entry_ids.append(data["id"])
                    self.log_test("Mood Entry - Complete Data", True, "Successfully created mood entry with all fields")
                else:
                    self.log_test("Mood Entry - Complete Data", False, "Invalid response structure", data)
            else:
                self.log_test("Mood Entry - Complete Data", False, f"Failed to create mood entry: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Mood Entry - Complete Data", False, f"Mood entry creation failed: {str(e)}")
        
        # Test mood entry without journal text
        minimal_mood_data = {
            "mood_value": 3,
            "mood_emoji": "😐",
            "mood_color": "#FFA500",
            "factors": {
                "sleep": 3,
                "stress": 3,
                "energy": 3
            }
        }
        
        try:
            response = self.make_request("POST", "/moods", minimal_mood_data)
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data:
                    self.mood_entry_ids.append(data["id"])
                    self.log_test("Mood Entry - Without Journal", True, "Successfully created mood entry without journal text")
                else:
                    self.log_test("Mood Entry - Without Journal", False, "Invalid response structure", data)
            else:
                self.log_test("Mood Entry - Without Journal", False, f"Failed to create minimal mood entry: {response.status_code}")
        except Exception as e:
            self.log_test("Mood Entry - Without Journal", False, f"Minimal mood entry creation failed: {str(e)}")
        
        # Create additional entries for testing
        additional_entries = [
            {"mood_value": 5, "mood_emoji": "😄", "mood_color": "#2196F3", "factors": {"sleep": 5, "stress": 1, "energy": 5}, "journal_text": "Amazing day! Everything went perfectly."},
            {"mood_value": 2, "mood_emoji": "😔", "mood_color": "#9C27B0", "factors": {"sleep": 2, "stress": 4, "energy": 2}, "journal_text": "Feeling a bit down today. Work was stressful."},
            {"mood_value": 4, "mood_emoji": "😌", "mood_color": "#00BCD4", "factors": {"sleep": 4, "stress": 2, "energy": 4}}
        ]
        
        for i, entry_data in enumerate(additional_entries):
            try:
                response = self.make_request("POST", "/moods", entry_data)
                if response.status_code == 200:
                    data = response.json()
                    self.mood_entry_ids.append(data["id"])
                    self.log_test(f"Additional Mood Entry {i+1}", True, f"Created entry with mood {entry_data['mood_value']}")
                else:
                    self.log_test(f"Additional Mood Entry {i+1}", False, f"Failed: {response.status_code}")
            except Exception as e:
                self.log_test(f"Additional Mood Entry {i+1}", False, f"Failed: {str(e)}")
    
    def test_mood_entry_retrieval(self):
        """Test mood entry retrieval"""
        print("\n=== Testing Mood Entry Retrieval ===")
        
        if not self.auth_token:
            self.log_test("Mood Entry Retrieval", False, "No auth token available")
            return
        
        # Test default retrieval (30 days)
        try:
            response = self.make_request("GET", "/moods")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    # Check if entries are sorted by timestamp (newest first)
                    if len(data) > 1:
                        timestamps = [entry.get("timestamp") for entry in data if "timestamp" in entry]
                        if timestamps:
                            sorted_check = all(timestamps[i] >= timestamps[i+1] for i in range(len(timestamps)-1))
                            if sorted_check:
                                self.log_test("Mood Entry Retrieval - Sorting", True, f"Retrieved {len(data)} entries, correctly sorted by timestamp")
                            else:
                                self.log_test("Mood Entry Retrieval - Sorting", False, "Entries not sorted by timestamp (newest first)")
                        else:
                            self.log_test("Mood Entry Retrieval - Sorting", False, "No timestamps found in entries")
                    else:
                        self.log_test("Mood Entry Retrieval", True, f"Retrieved {len(data)} entries")
                else:
                    self.log_test("Mood Entry Retrieval", False, "Response is not a list", data)
            else:
                self.log_test("Mood Entry Retrieval", False, f"Failed to retrieve entries: {response.status_code}")
        except Exception as e:
            self.log_test("Mood Entry Retrieval", False, f"Entry retrieval failed: {str(e)}")
        
        # Test with days parameter
        try:
            response = self.make_request("GET", "/moods?days=7")
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("Mood Entry Retrieval - Days Filter", True, f"Retrieved {len(data)} entries for last 7 days")
            else:
                self.log_test("Mood Entry Retrieval - Days Filter", False, f"Failed: {response.status_code}")
        except Exception as e:
            self.log_test("Mood Entry Retrieval - Days Filter", False, f"Failed: {str(e)}")
    
    def test_mood_statistics(self):
        """Test mood statistics endpoint"""
        print("\n=== Testing Mood Statistics ===")
        
        if not self.auth_token:
            self.log_test("Mood Statistics", False, "No auth token available")
            return
        
        try:
            response = self.make_request("GET", "/moods/stats")
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["average_mood", "total_entries", "mood_distribution", "average_factors"]
                
                if all(field in data for field in required_fields):
                    # Verify data types and values
                    if isinstance(data["average_mood"], (int, float)) and data["average_mood"] >= 0:
                        if isinstance(data["total_entries"], int) and data["total_entries"] >= 0:
                            if isinstance(data["mood_distribution"], dict):
                                if isinstance(data["average_factors"], dict):
                                    self.log_test("Mood Statistics", True, f"Stats: avg_mood={data['average_mood']:.2f}, entries={data['total_entries']}")
                                else:
                                    self.log_test("Mood Statistics", False, "average_factors is not a dict")
                            else:
                                self.log_test("Mood Statistics", False, "mood_distribution is not a dict")
                        else:
                            self.log_test("Mood Statistics", False, "total_entries is not a valid integer")
                    else:
                        self.log_test("Mood Statistics", False, "average_mood is not a valid number")
                else:
                    missing_fields = [field for field in required_fields if field not in data]
                    self.log_test("Mood Statistics", False, f"Missing required fields: {missing_fields}")
            else:
                self.log_test("Mood Statistics", False, f"Failed to get stats: {response.status_code}")
        except Exception as e:
            self.log_test("Mood Statistics", False, f"Stats request failed: {str(e)}")
        
        # Test with days parameter
        try:
            response = self.make_request("GET", "/moods/stats?days=7")
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("Mood Statistics - Days Filter", True, f"7-day stats: {data['total_entries']} entries")
            else:
                self.log_test("Mood Statistics - Days Filter", False, f"Failed: {response.status_code}")
        except Exception as e:
            self.log_test("Mood Statistics - Days Filter", False, f"Failed: {str(e)}")
    
    def test_ai_predictions(self):
        """Test AI prediction functionality"""
        print("\n=== Testing AI Predictions ===")
        
        if not self.auth_token:
            self.log_test("AI Predictions", False, "No auth token available")
            return
        
        # First, check if we have enough entries (should have at least 3 from previous tests)
        try:
            response = self.make_request("GET", "/moods")
            if response.status_code == 200:
                entries = response.json()
                entry_count = len(entries)
                
                if entry_count < 3:
                    # Test prediction with insufficient data
                    try:
                        response = self.make_request("POST", "/predictions/generate")
                        if response.status_code == 400:
                            self.log_test("AI Predictions - Insufficient Data", True, "Correctly rejected prediction with < 3 entries")
                        else:
                            self.log_test("AI Predictions - Insufficient Data", False, f"Should have returned 400, got {response.status_code}")
                    except Exception as e:
                        self.log_test("AI Predictions - Insufficient Data", False, f"Failed: {str(e)}")
                    return
                
                # Test prediction generation with sufficient data
                try:
                    response = self.make_request("POST", "/predictions/generate")
                    
                    if response.status_code == 200:
                        data = response.json()
                        required_fields = ["predicted_mood", "confidence", "reasoning", "coping_strategies", "prediction_date"]
                        
                        if all(field in data for field in required_fields):
                            # Verify data types and ranges
                            if 1 <= data["predicted_mood"] <= 5:
                                if 0 <= data["confidence"] <= 1:
                                    if isinstance(data["reasoning"], str) and len(data["reasoning"]) > 0:
                                        if isinstance(data["coping_strategies"], list) and len(data["coping_strategies"]) > 0:
                                            # Check if prediction_date is tomorrow
                                            tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
                                            if data["prediction_date"] == tomorrow:
                                                self.log_test("AI Predictions - Generation", True, f"Generated prediction: mood={data['predicted_mood']:.2f}, confidence={data['confidence']:.2f}")
                                            else:
                                                self.log_test("AI Predictions - Generation", False, f"Prediction date should be tomorrow ({tomorrow}), got {data['prediction_date']}")
                                        else:
                                            self.log_test("AI Predictions - Generation", False, "coping_strategies is not a valid list")
                                    else:
                                        self.log_test("AI Predictions - Generation", False, "reasoning is not a valid string")
                                else:
                                    self.log_test("AI Predictions - Generation", False, f"confidence should be 0-1, got {data['confidence']}")
                            else:
                                self.log_test("AI Predictions - Generation", False, f"predicted_mood should be 1-5, got {data['predicted_mood']}")
                        else:
                            missing_fields = [field for field in required_fields if field not in data]
                            self.log_test("AI Predictions - Generation", False, f"Missing required fields: {missing_fields}")
                    else:
                        self.log_test("AI Predictions - Generation", False, f"Failed to generate prediction: {response.status_code}", response.text)
                except Exception as e:
                    self.log_test("AI Predictions - Generation", False, f"Prediction generation failed: {str(e)}")
                
                # Test prediction history retrieval
                try:
                    response = self.make_request("GET", "/predictions")
                    
                    if response.status_code == 200:
                        data = response.json()
                        if isinstance(data, list):
                            self.log_test("AI Predictions - History", True, f"Retrieved {len(data)} prediction(s)")
                        else:
                            self.log_test("AI Predictions - History", False, "Response is not a list")
                    else:
                        self.log_test("AI Predictions - History", False, f"Failed to get predictions: {response.status_code}")
                except Exception as e:
                    self.log_test("AI Predictions - History", False, f"Prediction history failed: {str(e)}")
            
        except Exception as e:
            self.log_test("AI Predictions", False, f"Failed to check mood entries: {str(e)}")
    
    def test_data_export(self):
        """Test data export functionality"""
        print("\n=== Testing Data Export ===")
        
        if not self.auth_token:
            self.log_test("Data Export", False, "No auth token available")
            return
        
        try:
            response = self.make_request("GET", "/moods/export")
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["user", "export_date", "total_entries", "entries"]
                
                if all(field in data for field in required_fields):
                    # Verify user info structure
                    if "name" in data["user"] and "email" in data["user"]:
                        # Verify entries structure
                        if isinstance(data["entries"], list):
                            if data["entries"]:  # If there are entries
                                first_entry = data["entries"][0]
                                entry_fields = ["mood_value", "mood_emoji", "mood_color", "factors", "timestamp"]
                                if all(field in first_entry for field in entry_fields):
                                    self.log_test("Data Export", True, f"Successfully exported {data['total_entries']} entries")
                                else:
                                    missing_entry_fields = [field for field in entry_fields if field not in first_entry]
                                    self.log_test("Data Export", False, f"Missing entry fields: {missing_entry_fields}")
                            else:
                                self.log_test("Data Export", True, "Export successful (no entries to export)")
                        else:
                            self.log_test("Data Export", False, "entries is not a list")
                    else:
                        self.log_test("Data Export", False, "Missing user name or email in export")
                else:
                    missing_fields = [field for field in required_fields if field not in data]
                    self.log_test("Data Export", False, f"Missing required fields: {missing_fields}")
            else:
                self.log_test("Data Export", False, f"Failed to export data: {response.status_code}")
        except Exception as e:
            self.log_test("Data Export", False, f"Data export failed: {str(e)}")
    
    def test_edge_cases(self):
        """Test edge cases and error handling"""
        print("\n=== Testing Edge Cases ===")
        
        if not self.auth_token:
            self.log_test("Edge Cases", False, "No auth token available")
            return
        
        # Test invalid mood value (< 1)
        invalid_mood_low = {
            "mood_value": 0,
            "mood_emoji": "😢",
            "mood_color": "#FF0000",
            "factors": {"sleep": 3, "stress": 3, "energy": 3}
        }
        
        try:
            response = self.make_request("POST", "/moods", invalid_mood_low)
            if response.status_code == 422:  # Validation error
                self.log_test("Edge Case - Invalid Mood Low", True, "Correctly rejected mood_value < 1")
            else:
                self.log_test("Edge Case - Invalid Mood Low", False, f"Should have returned 422, got {response.status_code}")
        except Exception as e:
            self.log_test("Edge Case - Invalid Mood Low", False, f"Failed: {str(e)}")
        
        # Test invalid mood value (> 5)
        invalid_mood_high = {
            "mood_value": 6,
            "mood_emoji": "😄",
            "mood_color": "#00FF00",
            "factors": {"sleep": 3, "stress": 3, "energy": 3}
        }
        
        try:
            response = self.make_request("POST", "/moods", invalid_mood_high)
            if response.status_code == 422:  # Validation error
                self.log_test("Edge Case - Invalid Mood High", True, "Correctly rejected mood_value > 5")
            else:
                self.log_test("Edge Case - Invalid Mood High", False, f"Should have returned 422, got {response.status_code}")
        except Exception as e:
            self.log_test("Edge Case - Invalid Mood High", False, f"Failed: {str(e)}")
        
        # Test missing required fields
        incomplete_mood = {
            "mood_value": 3,
            # Missing mood_emoji, mood_color, factors
        }
        
        try:
            response = self.make_request("POST", "/moods", incomplete_mood)
            if response.status_code == 422:  # Validation error
                self.log_test("Edge Case - Missing Fields", True, "Correctly rejected incomplete mood entry")
            else:
                self.log_test("Edge Case - Missing Fields", False, f"Should have returned 422, got {response.status_code}")
        except Exception as e:
            self.log_test("Edge Case - Missing Fields", False, f"Failed: {str(e)}")
        
        # Test invalid auth token
        temp_token = self.auth_token
        self.auth_token = "invalid_token_12345"
        
        try:
            response = self.make_request("GET", "/auth/me")
            if response.status_code == 401:
                self.log_test("Edge Case - Invalid Token", True, "Correctly rejected invalid auth token")
            else:
                self.log_test("Edge Case - Invalid Token", False, f"Should have returned 401, got {response.status_code}")
        except Exception as e:
            self.log_test("Edge Case - Invalid Token", False, f"Failed: {str(e)}")
        
        # Restore valid token
        self.auth_token = temp_token
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting MoodNest Backend Comprehensive Testing")
        print(f"Base URL: {self.base_url}")
        print("=" * 60)
        
        # Authentication Flow
        self.test_user_registration()
        self.test_user_login()
        self.test_protected_endpoints_without_token()
        self.test_protected_endpoints_with_token()
        
        # Mood Entry Management
        self.test_mood_entry_creation()
        self.test_mood_entry_retrieval()
        
        # Mood Statistics
        self.test_mood_statistics()
        
        # AI Predictions
        self.test_ai_predictions()
        
        # Data Export
        self.test_data_export()
        
        # Edge Cases
        self.test_edge_cases()
        
        # Summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("🏁 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  ❌ {result['test']}: {result['message']}")
        
        print("\n📊 DETAILED RESULTS:")
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            print(f"  {status} {result['test']}")
        
        return {
            "total": total_tests,
            "passed": passed_tests,
            "failed": failed_tests,
            "success_rate": (passed_tests/total_tests)*100,
            "results": self.test_results
        }

if __name__ == "__main__":
    tester = MoodNestTester()
    summary = tester.run_all_tests()
    
    # Save results to file
    with open("/app/backend_test_results.json", "w") as f:
        json.dump(summary, f, indent=2, default=str)
    
    print(f"\n💾 Test results saved to: /app/backend_test_results.json")