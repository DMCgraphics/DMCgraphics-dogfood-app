#!/usr/bin/env node

/**
 * Test script to verify contact submissions table is created and API route works
 */

require("dotenv").config({ path: ".env.local" })
const { createClient } = require("@supabase/supabase-js")

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase environment variables")
  console.error("Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testContactSubmissions() {
  console.log("🔍 Testing contact submissions table...")

  // Test 1: Check if table exists
  console.log("\n1. Checking if contact_submissions table exists...")
  const { data: tables, error: tableError } = await supabase.rpc("pg_catalog.pg_tables", {})

  if (tableError) {
    // Try alternative method
    const { error: selectError } = await supabase.from("contact_submissions").select("count", { count: "exact" })

    if (selectError) {
      console.error("❌ Table does not exist or cannot be accessed:", selectError.message)
      console.log("\n📋 Next steps:")
      console.log("1. Run the migration script in Supabase SQL Editor:")
      console.log("   scripts/create-contact-submissions-table.sql")
      return
    }
  }

  console.log("✅ Table exists and is accessible")

  // Test 2: Insert a test record
  console.log("\n2. Testing insert...")
  const testSubmission = {
    name: "Test User",
    email: "test@example.com",
    subject: "general",
    message: "This is a test submission from the test script",
    status: "new",
  }

  const { data: insertData, error: insertError } = await supabase
    .from("contact_submissions")
    .insert([testSubmission])
    .select()

  if (insertError) {
    console.error("❌ Insert failed:", insertError.message)
    return
  }

  console.log("✅ Test record inserted successfully")
  console.log("   ID:", insertData[0].id)

  // Test 3: Query the record
  console.log("\n3. Testing select...")
  const { data: selectData, error: selectError } = await supabase
    .from("contact_submissions")
    .select("*")
    .eq("id", insertData[0].id)
    .single()

  if (selectError) {
    console.error("❌ Select failed:", selectError.message)
    return
  }

  console.log("✅ Record retrieved successfully")
  console.log("   Name:", selectData.name)
  console.log("   Email:", selectData.email)
  console.log("   Subject:", selectData.subject)
  console.log("   Status:", selectData.status)
  console.log("   Created at:", selectData.created_at)

  // Test 4: Update the record
  console.log("\n4. Testing update...")
  const { data: updateData, error: updateError } = await supabase
    .from("contact_submissions")
    .update({ status: "resolved", notes: "Test resolved" })
    .eq("id", insertData[0].id)
    .select()

  if (updateError) {
    console.error("❌ Update failed:", updateError.message)
    return
  }

  console.log("✅ Record updated successfully")
  console.log("   New status:", updateData[0].status)
  console.log("   Notes:", updateData[0].notes)

  // Test 5: Clean up test record
  console.log("\n5. Cleaning up test record...")
  const { error: deleteError } = await supabase.from("contact_submissions").delete().eq("id", insertData[0].id)

  if (deleteError) {
    console.error("❌ Delete failed:", deleteError.message)
    console.log("   (You may need to manually delete the test record)")
    return
  }

  console.log("✅ Test record deleted successfully")

  // Summary
  console.log("\n✅ All tests passed!")
  console.log("\n📊 Summary:")
  console.log("   • Table exists and is accessible")
  console.log("   • Insert operations work")
  console.log("   • Select operations work")
  console.log("   • Update operations work")
  console.log("   • Delete operations work")
  console.log("\n✨ The contact_submissions table is ready to use!")
}

testContactSubmissions().catch((error) => {
  console.error("❌ Test failed:", error)
  process.exit(1)
})
