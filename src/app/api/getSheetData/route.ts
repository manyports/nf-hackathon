import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { SheetData } from "@/types/SheetData";
import { processDataWithAI } from '@/utils/openai';

export async function GET() {
  console.log('Handler function started');
  try {
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    console.log('Fetching spreadsheet data');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Лист1',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('No data found in the spreadsheet');
      return NextResponse.json({ error: 'No data found' }, { status: 404 });
    }

    console.log(`Fetched ${rows.length} rows of data`);

    const initialData: SheetData[] = rows.slice(1).map((row, index) => ({
      name: row[0],
      telegramProfile: row[1],
      githubLink: row[3],
      university: row[4],
      experience: row[5],
      specialization: row[6] || '-',
      workPlace: row[7] || '-',
      projects: row[8] || '-',
      aiReviewed: row[9],
      aiVerdict: row[10] || '-',
      aiJustification: row[10] || '-',
      canBeInAlmaty: row[11],
    }));

    console.log('Processing AI data...');
    const aiProcessedData = await processDataWithAI(initialData);
    console.log('AI processed data:', aiProcessedData);

    console.log('Updating spreadsheet with AI-processed data');
    const values = [
      ['Name', 'Telegram Profile', 'GitHub Link', 'University', 'Experience', 'Specialization', 'Work Place', 'Projects', 'AI Reviewed', 'AI Verdict', 'AI Justification', 'Can be in Almaty'],
      ...aiProcessedData.map(item => [
        item.name,
        item.telegramProfile,
        item.githubLink,
        item.university,
        item.experience,
        item.specialization,
        item.workPlace,
        item.projects,
        item.aiReviewed ? 'TRUE' : 'FALSE',
        item.aiVerdict,
        item.aiJustification,
        item.canBeInAlmaty,
      ]),
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Лист1',
      valueInputOption: 'RAW',
      requestBody: { values },
    });

    console.log('Spreadsheet updated successfully');
    return NextResponse.json(aiProcessedData);
  } catch (error) {
    console.error('Error in handler function:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
    }
    return NextResponse.json({ error: 'An error occurred while fetching data' }, { status: 500 });
  }
}