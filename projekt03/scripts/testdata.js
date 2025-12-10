import db from '../database/db.js';

const testUsers = [
  { name: 'Jan', lname: 'Kowalski', vtype: 'Cross', vbrand: 'Yamaha', vmodel: 'YZF-450' },
  { name: 'Michał', lname: 'Nowak', vtype: 'Quad', vbrand: 'Yamaha', vmodel: 'Raptor' },
  { name: 'Anna', lname: 'Zielińska', vtype: 'Cross', vbrand: 'KTM', vmodel: 'EXC' },
  { name: 'Paweł', lname: 'Wójcik', vtype: 'Cross', vbrand: 'Honda', vmodel: 'CRF' },
  { name: 'Katarzyna', lname: 'Kowalczyk', vtype: 'Quad', vbrand: 'Can-Am', vmodel: 'Renegade' },
  { name: 'Tomasz', lname: 'Mazur', vtype: 'Cross', vbrand: 'Husqvarna', vmodel: 'TC' },
  { name: 'Ewa', lname: 'Lewandowska', vtype: 'Quad', vbrand: 'Polaris', vmodel: 'Sportsman' },
  { name: 'Łukasz', lname: 'Sikora', vtype: 'Cross', vbrand: 'Suzuki', vmodel: 'RM-Z' },
  { name: 'Monika', lname: 'Kaczmarek', vtype: 'Cross', vbrand: 'Beta', vmodel: 'RR' },
  { name: 'Rafał', lname: 'Duda', vtype: 'Quad', vbrand: 'Yamaha', vmodel: 'Grizzly' },
  { name: 'Agnieszka', lname: 'Szymczak', vtype: 'Cross', vbrand: 'KTM', vmodel: 'SX-F' },
  { name: 'Piotr', lname: 'Grabowski', vtype: 'Quad', vbrand: 'CFMoto', vmodel: 'CForce' },
  { name: 'Natalia', lname: 'Pawlak', vtype: 'Cross', vbrand: 'Husqvarna', vmodel: 'TX' },
  { name: 'Marek', lname: 'Krawczyk', vtype: 'Cross', vbrand: 'Honda', vmodel: 'CR' },
  { name: 'Paulina', lname: 'Urbańska', vtype: 'Quad', vbrand: 'Can-Am', vmodel: 'Maverick' },
  { name: 'Adam', lname: 'Górski', vtype: 'Cross', vbrand: 'Kawasaki', vmodel: 'KX' },
  { name: 'Dorota', lname: 'Zając', vtype: 'Quad', vbrand: 'Arctic Cat', vmodel: 'Alterra' },
  { name: 'Jakub', lname: 'Szymański', vtype: 'Cross', vbrand: 'Yamaha', vmodel: 'WR' },
  { name: 'Magdalena', lname: 'Jankowska', vtype: 'Quad', vbrand: 'Polaris', vmodel: 'Outlaw' },
  { name: 'Bartosz', lname: 'Kubiak', vtype: 'Cross', vbrand: 'Sherco', vmodel: 'SE' },
];

function seed() {
  try {
    const before = db.getUsers().length;
    console.log(`Users before seed: ${before}`);
    for (const u of testUsers) {
      db.addUser(u.name, u.lname, u.vtype, u.vbrand, u.vmodel);
    }
    const after = db.getUsers().length;
    console.log(`Users after seed: ${after} (added: ${after - before})`);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
