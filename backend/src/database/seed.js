require('dotenv').config();
const { pool } = require('../config/database');

async function seedDatabase() {
  try {
    console.log('Seeding database...');

    // Seed holidays for Germany (2024-2025)
    const holidays = [
      { name: "New Year's Day", date: '2024-01-01', country: 'Germany', region: 'All', type: 'public', description: 'The first day of the year', cultural_context: 'Celebrated with fireworks and champagne at midnight', is_public_holiday: true, year: 2024 },
      { name: "Good Friday", date: '2024-03-29', country: 'Germany', region: 'All', type: 'public', description: 'Christian holiday commemorating the crucifixion of Jesus', cultural_context: 'A solemn day of reflection in Christian tradition', is_public_holiday: true, year: 2024 },
      { name: "Easter Monday", date: '2024-04-01', country: 'Germany', region: 'All', type: 'public', description: 'The day after Easter Sunday', cultural_context: 'Family gatherings and Easter egg hunts continue', is_public_holiday: true, year: 2024 },
      { name: "Labour Day", date: '2024-05-01', country: 'Germany', region: 'All', type: 'public', description: 'International Workers Day', cultural_context: 'Demonstrations and celebrations honoring workers rights', is_public_holiday: true, year: 2024 },
      { name: "Ascension Day", date: '2024-05-09', country: 'Germany', region: 'All', type: 'public', description: 'Christian holiday celebrating Jesus ascension', cultural_context: 'Also known as Fathers Day in Germany', is_public_holiday: true, year: 2024 },
      { name: "Whit Monday", date: '2024-05-20', country: 'Germany', region: 'All', type: 'public', description: 'The day after Pentecost Sunday', cultural_context: 'Christian feast day', is_public_holiday: true, year: 2024 },
      { name: "Oktoberfest Start", date: '2024-09-21', country: 'Germany', region: 'Bavaria', type: 'cultural', description: 'World famous beer festival begins', cultural_context: 'Two-week festival in Munich with traditional Bavarian culture', is_public_holiday: false, year: 2024 },
      { name: "German Unity Day", date: '2024-10-03', country: 'Germany', region: 'All', type: 'public', description: 'Commemorates German reunification', cultural_context: 'Celebrates the reunification of East and West Germany in 1990', is_public_holiday: true, year: 2024 },
      { name: "All Saints Day", date: '2024-11-01', country: 'Germany', region: 'Bavaria', type: 'public', description: 'Christian feast honoring all saints', cultural_context: 'Visiting graves and honoring deceased family members', is_public_holiday: true, year: 2024 },
      { name: "Christmas Eve", date: '2024-12-24', country: 'Germany', region: 'All', type: 'cultural', description: 'The evening before Christmas', cultural_context: 'Main gift-giving day in Germany, family gatherings', is_public_holiday: false, year: 2024 },
      { name: "Christmas Day", date: '2024-12-25', country: 'Germany', region: 'All', type: 'public', description: 'Celebration of Jesus birth', cultural_context: 'Religious observances and family time', is_public_holiday: true, year: 2024 },
      { name: "Boxing Day", date: '2024-12-26', country: 'Germany', region: 'All', type: 'public', description: 'Second day of Christmas', cultural_context: 'Extended family gatherings continue', is_public_holiday: true, year: 2024 },
      { name: "New Year's Day", date: '2025-01-01', country: 'Germany', region: 'All', type: 'public', description: 'The first day of the year', cultural_context: 'Celebrated with fireworks and champagne at midnight', is_public_holiday: true, year: 2025 }
    ];

    for (const holiday of holidays) {
      await pool.query(
        `INSERT INTO holidays (name, date, country, region, type, description, cultural_context, is_public_holiday, year, traditions)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT DO NOTHING`,
        [holiday.name, holiday.date, holiday.country, holiday.region, holiday.type,
         holiday.description, holiday.cultural_context, holiday.is_public_holiday, holiday.year, []]
      );
    }

    console.log('Holidays seeded successfully!');

    // Seed sample business categories
    console.log('Database seeding complete!');
    console.log('Note: Create your first user by signing in with Google');

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedDatabase();
