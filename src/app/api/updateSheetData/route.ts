import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { SheetData } from "@/types/SheetData";

export async function POST(req: Request) {
  try {
    const updatedItem: SheetData = await req.json();

    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // First, get all data to find the row to update
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Лист1',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return NextResponse.json({ message: 'No data found' }, { status: 404 });
    }

    // Find the row index of the item to update
    const rowIndex = rows.findIndex((row) => row[0] === updatedItem.name);
    if (rowIndex === -1) {
      return NextResponse.json({ message: 'Item not found' }, { status: 404 });
    }

    // Update the row
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `Лист1!A${rowIndex + 1}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          updatedItem.name,
          updatedItem.telegramProfile,
          updatedItem.githubLink,
          updatedItem.university,
          updatedItem.experience,
          updatedItem.specialization,
          updatedItem.workPlace,
          updatedItem.projects,
          updatedItem.aiReviewed,
          updatedItem.aiVerdict,
          updatedItem.aiJustification,
          updatedItem.canBeInAlmaty,
        ]],
      },
    });

    return NextResponse.json({ message: 'Data updated successfully' });
  } catch (error) {
    console.error('Error updating sheet:', error);
    return NextResponse.json({ message: 'Error updating data' }, { status: 500 });
  }
}