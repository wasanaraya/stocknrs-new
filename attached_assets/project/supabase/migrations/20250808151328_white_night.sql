@@ .. @@
 CREATE POLICY "Allow all operations on approvals" ON approvals FOR ALL USING (true);
 
+-- 22. Grant permissions to anonymous role for all tables
+GRANT ALL ON TABLE categories TO anon;
+GRANT ALL ON TABLE suppliers TO anon;
+GRANT ALL ON TABLE products TO anon;
+GRANT ALL ON TABLE movements TO anon;
+GRANT ALL ON TABLE account_codes TO anon;
+GRANT ALL ON TABLE budget_requests TO anon;
+GRANT ALL ON TABLE approvals TO anon;
+
 -- 21. เพิ่ม trigger สำหรับ updated_at ในตาราง budget_requests