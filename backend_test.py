"""
Comprehensive Backend API Testing for Modern Notepad App
Tests all CRUD operations, search, filters, lifecycle, AI endpoints
"""
import requests
import sys
import time
from datetime import datetime

class NotepadAPITester:
    def __init__(self, base_url="https://notepad-pro-48.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_note_id = None
        self.test_folder_id = None
        self.test_tag_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None, timeout=10):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}" if endpoint else self.base_url
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=timeout)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=timeout)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")

            return success, response.json() if response.text and response.status_code < 500 else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health(self):
        """Test health endpoint"""
        success, response = self.run_test(
            "Health endpoint",
            "GET",
            "",
            200
        )
        if success:
            if response.get('status') == 'ok' and response.get('ai') is True:
                print(f"   ✓ Health check passed: {response}")
                return True
            else:
                print(f"   ✗ Health check failed: {response}")
                self.tests_passed -= 1
                return False
        return False

    def test_create_note(self):
        """Create a test note"""
        success, response = self.run_test(
            "Create note",
            "POST",
            "notes",
            200,
            data={
                "title": "Test Note for API Testing",
                "html_content": "<h2>Test Note</h2><p>This is a test note with some content for testing the notepad API. It has enough content to test AI features.</p><ul><li>First item</li><li>Second item</li></ul><p>We need to test search functionality, so here are some keywords: productivity, planning, workflow.</p>",
                "folder_id": None,
                "tag_ids": [],
                "color": None
            }
        )
        if success and 'id' in response:
            self.test_note_id = response['id']
            print(f"   ✓ Created note with ID: {self.test_note_id}")
            return True
        return False

    def test_get_note(self):
        """Get a note by ID"""
        if not self.test_note_id:
            print("⚠️  Skipping - no test note ID")
            return False
        
        success, response = self.run_test(
            "Get note by ID",
            "GET",
            f"notes/{self.test_note_id}",
            200
        )
        if success and response.get('id') == self.test_note_id:
            print(f"   ✓ Retrieved note: {response.get('title')}")
            return True
        return False

    def test_update_note(self):
        """Update note content"""
        if not self.test_note_id:
            print("⚠️  Skipping - no test note ID")
            return False
        
        success, response = self.run_test(
            "Update note (title + content)",
            "PUT",
            f"notes/{self.test_note_id}",
            200,
            data={
                "title": "Updated Test Note",
                "html_content": "<h2>Updated Content</h2><p>This content has been updated to test the PUT endpoint. The plain_text and word_count should be recomputed.</p>"
            }
        )
        if success:
            if response.get('title') == 'Updated Test Note' and response.get('word_count', 0) > 0:
                print(f"   ✓ Note updated, word_count: {response.get('word_count')}")
                return True
            else:
                print(f"   ✗ Update failed: {response}")
                self.tests_passed -= 1
        return False

    def test_list_notes(self):
        """List all notes"""
        success, response = self.run_test(
            "List notes (view=all)",
            "GET",
            "notes",
            200,
            params={"view": "all", "sort": "updated"}
        )
        if success and isinstance(response, list):
            print(f"   ✓ Retrieved {len(response)} notes")
            return True
        return False

    def test_search(self):
        """Test full-text search"""
        success, response = self.run_test(
            "Search notes (q=test)",
            "GET",
            "notes",
            200,
            params={"q": "test"}
        )
        if success and isinstance(response, list):
            print(f"   ✓ Search returned {len(response)} results")
            return True
        return False

    def test_create_folder(self):
        """Create a folder"""
        success, response = self.run_test(
            "Create folder",
            "POST",
            "folders",
            200,
            data={"name": "Test Folder"}
        )
        if success and 'id' in response:
            self.test_folder_id = response['id']
            print(f"   ✓ Created folder with ID: {self.test_folder_id}")
            return True
        return False

    def test_list_folders(self):
        """List all folders"""
        success, response = self.run_test(
            "List folders",
            "GET",
            "folders",
            200
        )
        if success and isinstance(response, list):
            print(f"   ✓ Retrieved {len(response)} folders")
            return True
        return False

    def test_update_folder(self):
        """Update folder name"""
        if not self.test_folder_id:
            print("⚠️  Skipping - no test folder ID")
            return False
        
        success, response = self.run_test(
            "Update folder",
            "PUT",
            f"folders/{self.test_folder_id}",
            200,
            data={"name": "Updated Test Folder"}
        )
        if success and response.get('name') == 'Updated Test Folder':
            print(f"   ✓ Folder updated")
            return True
        return False

    def test_assign_folder_to_note(self):
        """Assign folder to note"""
        if not self.test_note_id or not self.test_folder_id:
            print("⚠️  Skipping - missing note or folder ID")
            return False
        
        success, response = self.run_test(
            "Assign folder to note",
            "PUT",
            f"notes/{self.test_note_id}",
            200,
            data={"folder_id": self.test_folder_id}
        )
        if success and response.get('folder_id') == self.test_folder_id:
            print(f"   ✓ Note assigned to folder")
            return True
        return False

    def test_filter_by_folder(self):
        """Filter notes by folder"""
        if not self.test_folder_id:
            print("⚠️  Skipping - no test folder ID")
            return False
        
        success, response = self.run_test(
            "Filter notes by folder",
            "GET",
            "notes",
            200,
            params={"view": "folder", "folder_id": self.test_folder_id}
        )
        if success and isinstance(response, list):
            print(f"   ✓ Folder filter returned {len(response)} notes")
            return True
        return False

    def test_create_tag(self):
        """Create a tag"""
        success, response = self.run_test(
            "Create tag",
            "POST",
            "tags",
            200,
            data={"name": "test-tag", "color": "186 52% 44%"}
        )
        if success and 'id' in response:
            self.test_tag_id = response['id']
            print(f"   ✓ Created tag with ID: {self.test_tag_id}")
            return True
        return False

    def test_list_tags(self):
        """List all tags"""
        success, response = self.run_test(
            "List tags",
            "GET",
            "tags",
            200
        )
        if success and isinstance(response, list):
            print(f"   ✓ Retrieved {len(response)} tags")
            return True
        return False

    def test_update_tag(self):
        """Update tag"""
        if not self.test_tag_id:
            print("⚠️  Skipping - no test tag ID")
            return False
        
        success, response = self.run_test(
            "Update tag",
            "PUT",
            f"tags/{self.test_tag_id}",
            200,
            data={"name": "updated-tag", "color": "200 60% 50%"}
        )
        if success and response.get('name') == 'updated-tag':
            print(f"   ✓ Tag updated")
            return True
        return False

    def test_assign_tag_to_note(self):
        """Assign tag to note"""
        if not self.test_note_id or not self.test_tag_id:
            print("⚠️  Skipping - missing note or tag ID")
            return False
        
        success, response = self.run_test(
            "Assign tag to note",
            "PUT",
            f"notes/{self.test_note_id}",
            200,
            data={"tag_ids": [self.test_tag_id]}
        )
        if success and self.test_tag_id in response.get('tag_ids', []):
            print(f"   ✓ Tag assigned to note")
            return True
        return False

    def test_filter_by_tag(self):
        """Filter notes by tag"""
        if not self.test_tag_id:
            print("⚠️  Skipping - no test tag ID")
            return False
        
        success, response = self.run_test(
            "Filter notes by tag",
            "GET",
            "notes",
            200,
            params={"view": "tag", "tag_id": self.test_tag_id}
        )
        if success and isinstance(response, list):
            print(f"   ✓ Tag filter returned {len(response)} notes")
            return True
        return False

    def test_pin_note(self):
        """Pin a note"""
        if not self.test_note_id:
            print("⚠️  Skipping - no test note ID")
            return False
        
        success, response = self.run_test(
            "Pin note",
            "POST",
            f"notes/{self.test_note_id}/pin",
            200,
            data={"value": True}
        )
        if success and response.get('pinned') is True:
            print(f"   ✓ Note pinned")
            return True
        return False

    def test_filter_pinned(self):
        """Filter pinned notes"""
        success, response = self.run_test(
            "Filter pinned notes",
            "GET",
            "notes",
            200,
            params={"view": "pinned"}
        )
        if success and isinstance(response, list):
            print(f"   ✓ Pinned filter returned {len(response)} notes")
            return True
        return False

    def test_archive_note(self):
        """Archive a note"""
        if not self.test_note_id:
            print("⚠️  Skipping - no test note ID")
            return False
        
        success, response = self.run_test(
            "Archive note",
            "POST",
            f"notes/{self.test_note_id}/archive",
            200,
            data={"value": True}
        )
        if success and response.get('archived') is True:
            print(f"   ✓ Note archived")
            return True
        return False

    def test_filter_archive(self):
        """Filter archived notes"""
        success, response = self.run_test(
            "Filter archived notes",
            "GET",
            "notes",
            200,
            params={"view": "archive"}
        )
        if success and isinstance(response, list):
            print(f"   ✓ Archive filter returned {len(response)} notes")
            return True
        return False

    def test_unarchive_note(self):
        """Unarchive a note"""
        if not self.test_note_id:
            print("⚠️  Skipping - no test note ID")
            return False
        
        success, response = self.run_test(
            "Unarchive note",
            "POST",
            f"notes/{self.test_note_id}/archive",
            200,
            data={"value": False}
        )
        if success and response.get('archived') is False:
            print(f"   ✓ Note unarchived")
            return True
        return False

    def test_trash_note(self):
        """Trash a note"""
        if not self.test_note_id:
            print("⚠️  Skipping - no test note ID")
            return False
        
        success, response = self.run_test(
            "Trash note",
            "POST",
            f"notes/{self.test_note_id}/trash",
            200
        )
        if success and response.get('trashed') is True:
            print(f"   ✓ Note trashed")
            return True
        return False

    def test_filter_trash(self):
        """Filter trashed notes"""
        success, response = self.run_test(
            "Filter trashed notes",
            "GET",
            "notes",
            200,
            params={"view": "trash"}
        )
        if success and isinstance(response, list):
            print(f"   ✓ Trash filter returned {len(response)} notes")
            return True
        return False

    def test_restore_note(self):
        """Restore a note from trash"""
        if not self.test_note_id:
            print("⚠️  Skipping - no test note ID")
            return False
        
        success, response = self.run_test(
            "Restore note",
            "POST",
            f"notes/{self.test_note_id}/restore",
            200
        )
        if success and response.get('trashed') is False:
            print(f"   ✓ Note restored")
            return True
        return False

    def test_duplicate_note(self):
        """Duplicate a note"""
        if not self.test_note_id:
            print("⚠️  Skipping - no test note ID")
            return False
        
        success, response = self.run_test(
            "Duplicate note",
            "POST",
            f"notes/{self.test_note_id}/duplicate",
            200
        )
        if success and 'id' in response and '(copy)' in response.get('title', ''):
            print(f"   ✓ Note duplicated: {response.get('title')}")
            # Clean up the duplicate
            dup_id = response['id']
            requests.delete(f"{self.base_url}/notes/{dup_id}")
            return True
        return False

    def test_export_markdown(self):
        """Export note as markdown"""
        if not self.test_note_id:
            print("⚠️  Skipping - no test note ID")
            return False
        
        url = f"{self.base_url}/notes/{self.test_note_id}/export"
        try:
            response = requests.get(url, params={"format": "md"}, timeout=10)
            if response.status_code == 200 and 'text/markdown' in response.headers.get('Content-Type', ''):
                print(f"✅ Passed - Export markdown")
                self.tests_run += 1
                self.tests_passed += 1
                return True
            else:
                print(f"❌ Failed - Export markdown: {response.status_code}")
                self.tests_run += 1
                return False
        except Exception as e:
            print(f"❌ Failed - Export markdown: {str(e)}")
            self.tests_run += 1
            return False

    def test_export_txt(self):
        """Export note as text"""
        if not self.test_note_id:
            print("⚠️  Skipping - no test note ID")
            return False
        
        url = f"{self.base_url}/notes/{self.test_note_id}/export"
        try:
            response = requests.get(url, params={"format": "txt"}, timeout=10)
            if response.status_code == 200 and 'text/plain' in response.headers.get('Content-Type', ''):
                print(f"✅ Passed - Export txt")
                self.tests_run += 1
                self.tests_passed += 1
                return True
            else:
                print(f"❌ Failed - Export txt: {response.status_code}")
                self.tests_run += 1
                return False
        except Exception as e:
            print(f"❌ Failed - Export txt: {str(e)}")
            self.tests_run += 1
            return False

    def test_export_html(self):
        """Export note as HTML"""
        if not self.test_note_id:
            print("⚠️  Skipping - no test note ID")
            return False
        
        url = f"{self.base_url}/notes/{self.test_note_id}/export"
        try:
            response = requests.get(url, params={"format": "html"}, timeout=10)
            if response.status_code == 200 and 'text/html' in response.headers.get('Content-Type', ''):
                print(f"✅ Passed - Export html")
                self.tests_run += 1
                self.tests_passed += 1
                return True
            else:
                print(f"❌ Failed - Export html: {response.status_code}")
                self.tests_run += 1
                return False
        except Exception as e:
            print(f"❌ Failed - Export html: {str(e)}")
            self.tests_run += 1
            return False

    def test_stats(self):
        """Get workspace stats"""
        success, response = self.run_test(
            "Get workspace stats",
            "GET",
            "stats",
            200
        )
        if success:
            required_keys = ['all', 'pinned', 'archive', 'trash', 'total', 'words', 'folders', 'tags']
            if all(key in response for key in required_keys):
                print(f"   ✓ Stats: {response}")
                return True
            else:
                print(f"   ✗ Missing keys in stats: {response}")
                self.tests_passed -= 1
        return False

    def test_ai_title(self):
        """Test AI title generation"""
        if not self.test_note_id:
            print("⚠️  Skipping - no test note ID")
            return False
        
        success, response = self.run_test(
            "AI: Generate title",
            "POST",
            "ai/title",
            200,
            data={"note_id": self.test_note_id},
            timeout=60
        )
        if success and 'title' in response:
            print(f"   ✓ AI generated title: {response.get('title')}")
            return True
        return False

    def test_ai_summarize(self):
        """Test AI summarization"""
        if not self.test_note_id:
            print("⚠️  Skipping - no test note ID")
            return False
        
        success, response = self.run_test(
            "AI: Summarize",
            "POST",
            "ai/summarize",
            200,
            data={"note_id": self.test_note_id},
            timeout=60
        )
        if success and 'bullets' in response and isinstance(response['bullets'], list):
            print(f"   ✓ AI summary: {len(response['bullets'])} bullets")
            return True
        return False

    def test_ai_action_items(self):
        """Test AI action items extraction"""
        if not self.test_note_id:
            print("⚠️  Skipping - no test note ID")
            return False
        
        success, response = self.run_test(
            "AI: Extract action items",
            "POST",
            "ai/action-items",
            200,
            data={"note_id": self.test_note_id},
            timeout=60
        )
        if success and 'items' in response and isinstance(response['items'], list):
            print(f"   ✓ AI action items: {len(response['items'])} items")
            return True
        return False

    def test_ai_suggest_tags(self):
        """Test AI tag suggestions"""
        if not self.test_note_id:
            print("⚠️  Skipping - no test note ID")
            return False
        
        success, response = self.run_test(
            "AI: Suggest tags",
            "POST",
            "ai/suggest-tags",
            200,
            data={"note_id": self.test_note_id},
            timeout=60
        )
        if success and 'tags' in response and isinstance(response['tags'], list):
            print(f"   ✓ AI suggested tags: {response.get('tags')}")
            return True
        return False

    def test_ai_ask(self):
        """Test AI Q&A"""
        if not self.test_note_id:
            print("⚠️  Skipping - no test note ID")
            return False
        
        success, response = self.run_test(
            "AI: Ask question",
            "POST",
            "ai/ask",
            200,
            data={"note_id": self.test_note_id, "question": "What is this note about?"},
            timeout=60
        )
        if success and 'answer' in response:
            print(f"   ✓ AI answer: {response.get('answer')[:100]}...")
            return True
        return False

    def test_ai_empty_note_guardrail(self):
        """Test AI guardrail for empty notes"""
        # Create an empty note
        success, response = self.run_test(
            "Create empty note for AI guardrail test",
            "POST",
            "notes",
            200,
            data={"title": "Empty", "html_content": "<p></p>"}
        )
        if not success or 'id' not in response:
            return False
        
        empty_note_id = response['id']
        
        # Try AI on empty note - should return 400
        success, response = self.run_test(
            "AI: Guardrail for empty note",
            "POST",
            "ai/title",
            400,
            data={"note_id": empty_note_id},
            timeout=10
        )
        
        # Clean up
        requests.delete(f"{self.base_url}/notes/{empty_note_id}")
        
        if success:
            print(f"   ✓ AI guardrail working: {response.get('detail', '')}")
            return True
        return False

    def test_chat_history(self):
        """Test chat history retrieval"""
        if not self.test_note_id:
            print("⚠️  Skipping - no test note ID")
            return False
        
        success, response = self.run_test(
            "Get chat history",
            "GET",
            f"notes/{self.test_note_id}/chat",
            200
        )
        if success and isinstance(response, list):
            print(f"   ✓ Chat history: {len(response)} messages")
            return True
        return False

    def test_clear_chat(self):
        """Test clearing chat history"""
        if not self.test_note_id:
            print("⚠️  Skipping - no test note ID")
            return False
        
        success, response = self.run_test(
            "Clear chat history",
            "DELETE",
            f"notes/{self.test_note_id}/chat",
            200
        )
        if success:
            print(f"   ✓ Chat cleared: {response.get('deleted', 0)} messages")
            return True
        return False

    def test_delete_tag(self):
        """Delete a tag (should pull from notes)"""
        if not self.test_tag_id:
            print("⚠️  Skipping - no test tag ID")
            return False
        
        success, response = self.run_test(
            "Delete tag",
            "DELETE",
            f"tags/{self.test_tag_id}",
            200
        )
        if success and response.get('deleted') is True:
            print(f"   ✓ Tag deleted")
            return True
        return False

    def test_delete_folder(self):
        """Delete a folder (should null folder_id on notes)"""
        if not self.test_folder_id:
            print("⚠️  Skipping - no test folder ID")
            return False
        
        success, response = self.run_test(
            "Delete folder",
            "DELETE",
            f"folders/{self.test_folder_id}",
            200
        )
        if success and response.get('deleted') is True:
            print(f"   ✓ Folder deleted")
            return True
        return False

    def test_delete_note(self):
        """Permanently delete a note"""
        if not self.test_note_id:
            print("⚠️  Skipping - no test note ID")
            return False
        
        success, response = self.run_test(
            "Delete note permanently",
            "DELETE",
            f"notes/{self.test_note_id}",
            200
        )
        if success and response.get('deleted') is True:
            print(f"   ✓ Note deleted permanently")
            return True
        return False

def main():
    print("=" * 80)
    print("BACKEND API TESTING - Modern Notepad App")
    print("=" * 80)
    
    tester = NotepadAPITester()
    
    # Test sequence
    print("\n📋 BASIC ENDPOINTS")
    tester.test_health()
    
    print("\n📝 NOTES CRUD")
    tester.test_create_note()
    tester.test_get_note()
    tester.test_update_note()
    tester.test_list_notes()
    tester.test_search()
    
    print("\n📁 FOLDERS")
    tester.test_create_folder()
    tester.test_list_folders()
    tester.test_update_folder()
    tester.test_assign_folder_to_note()
    tester.test_filter_by_folder()
    
    print("\n🏷️  TAGS")
    tester.test_create_tag()
    tester.test_list_tags()
    tester.test_update_tag()
    tester.test_assign_tag_to_note()
    tester.test_filter_by_tag()
    
    print("\n📌 LIFECYCLE")
    tester.test_pin_note()
    tester.test_filter_pinned()
    tester.test_archive_note()
    tester.test_filter_archive()
    tester.test_unarchive_note()
    tester.test_trash_note()
    tester.test_filter_trash()
    tester.test_restore_note()
    tester.test_duplicate_note()
    
    print("\n📊 STATS & EXPORT")
    tester.test_stats()
    tester.test_export_markdown()
    tester.test_export_txt()
    tester.test_export_html()
    
    print("\n🤖 AI FEATURES")
    tester.test_ai_title()
    tester.test_ai_summarize()
    tester.test_ai_action_items()
    tester.test_ai_suggest_tags()
    tester.test_ai_ask()
    tester.test_ai_empty_note_guardrail()
    
    print("\n💬 CHAT HISTORY")
    tester.test_chat_history()
    tester.test_clear_chat()
    
    print("\n🗑️  CLEANUP")
    tester.test_delete_tag()
    tester.test_delete_folder()
    tester.test_delete_note()
    
    # Print results
    print("\n" + "=" * 80)
    print(f"📊 RESULTS: {tester.tests_passed}/{tester.tests_run} tests passed")
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"   Success rate: {success_rate:.1f}%")
    print("=" * 80)
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
