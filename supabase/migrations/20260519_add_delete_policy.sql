-- Add policy to allow authenticated users to delete orders
CREATE POLICY "Allow authenticated users to delete orders"
  ON orders FOR DELETE
  TO authenticated
  USING (true);
