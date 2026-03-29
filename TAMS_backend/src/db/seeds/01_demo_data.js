const today = new Date().toISOString().split('T')[0];
const currentMonth = today.slice(0, 7);

exports.seed = async function(knex) {
  // Clear existing data (order matters for FK constraints)
  await knex('whatsapp_logs').del();
  await knex('exam_results').del();
  await knex('student_fees').del();
  await knex('attendance').del();
  await knex('student_contacts').del();
  await knex('subjects').del();
  await knex('exams').del();
  await knex('students').del();
  await knex('groups').del();
  await knex('batches').del();
  await knex('settings').del();

  // Settings
  await knex('settings').insert([
    { key: 'academy_name', value: 'Tips Academy' },
    { key: 'academy_phone', value: '03001234567' },
    { key: 'academy_address', value: 'Tips Street 123, Lahore' },
    { key: 'academy_email', value: 'info@tipsacademy.pk' },
    { key: 'default_monthly_fee', value: '3000' },
    { key: 'default_admission_fee', value: '5000' },
    { key: 'fee_due_day', value: '10' },
  ]);

  // Batches
  const [batch1Id] = await knex('batches').insert({
    name: 'Matric 2025 - Morning',
    grade: '10',
    academic_year: '2024-25',
    monthly_fee: 3000,
    admission_fee: 5000,
    is_active: true,
  });

  const [batch2Id] = await knex('batches').insert({
    name: 'Inter 2025 - Evening',
    grade: '12',
    academic_year: '2024-25',
    monthly_fee: 4000,
    admission_fee: 6000,
    is_active: true,
  });

  // Groups
  const [grp1] = await knex('groups').insert({ batch_id: batch1Id, name: 'Biology Group' });
  const [grp2] = await knex('groups').insert({ batch_id: batch1Id, name: 'Computer Group' });
  const [grp3] = await knex('groups').insert({ batch_id: batch2Id, name: 'Pre-Medical' });

  // Subjects
  await knex('subjects').insert([
    { batch_id: batch1Id, name: 'Mathematics', code: 'MATH' },
    { batch_id: batch1Id, name: 'Physics', code: 'PHY' },
    { batch_id: batch1Id, name: 'Chemistry', code: 'CHEM' },
    { batch_id: batch1Id, name: 'Biology', code: 'BIO' },
    { batch_id: batch1Id, name: 'English', code: 'ENG' },
    { batch_id: batch2Id, name: 'Mathematics', code: 'MATH' },
    { batch_id: batch2Id, name: 'Biology', code: 'BIO' },
    { batch_id: batch2Id, name: 'Chemistry', code: 'CHEM' },
  ]);

  // Students
  const students = [
    { name: 'Ahmed Ali', father_name: 'Muhammad Ali', gender: 'male', dob: '2008-03-15', batch_id: batch1Id, group_id: grp1, monthly_fee: 3000, admission_fee: 5000, discount_type: 'fixed', discount_value: 0, status: 'active', admission_date: '2024-04-01' },
    { name: 'Fatima Khan', father_name: 'Imran Khan', gender: 'female', dob: '2008-07-22', batch_id: batch1Id, group_id: grp1, monthly_fee: 3000, admission_fee: 5000, discount_type: 'percent', discount_value: 10, status: 'active', admission_date: '2024-04-01' },
    { name: 'Usman Malik', father_name: 'Tariq Malik', gender: 'male', dob: '2007-11-05', batch_id: batch1Id, group_id: grp2, monthly_fee: 3000, admission_fee: 5000, discount_type: 'fixed', discount_value: 500, status: 'active', admission_date: '2024-04-05' },
    { name: 'Ayesha Noor', father_name: 'Noor Ahmed', gender: 'female', dob: '2008-01-18', batch_id: batch1Id, group_id: grp2, monthly_fee: 3000, admission_fee: 5000, discount_type: 'fixed', discount_value: 0, status: 'active', admission_date: '2024-04-10' },
    { name: 'Bilal Hassan', father_name: 'Hassan Raza', gender: 'male', dob: '2007-05-30', batch_id: batch1Id, group_id: null, monthly_fee: 3000, admission_fee: 5000, discount_type: 'fixed', discount_value: 0, status: 'active', admission_date: '2024-05-01' },
    { name: 'Zainab Shah', father_name: 'Shah Nawaz', gender: 'female', dob: '2005-09-12', batch_id: batch2Id, group_id: grp3, monthly_fee: 4000, admission_fee: 6000, discount_type: 'fixed', discount_value: 0, status: 'active', admission_date: '2024-04-01' },
    { name: 'Omar Farooq', father_name: 'Farooq Ahmed', gender: 'male', dob: '2005-02-28', batch_id: batch2Id, group_id: grp3, monthly_fee: 4000, admission_fee: 6000, discount_type: 'percent', discount_value: 15, status: 'active', admission_date: '2024-04-01' },
  ];

  const studentIds = [];
  for (const s of students) {
    const [id] = await knex('students').insert(s);
    studentIds.push(id);
  }

  // Contacts
  const contacts = [
    { student_id: studentIds[0], parent_name: 'Muhammad Ali', phone: '03001111111', whatsapp_number: '923001111111', relation: 'father', is_primary: true },
    { student_id: studentIds[1], parent_name: 'Imran Khan', phone: '03002222222', whatsapp_number: '923002222222', relation: 'father', is_primary: true },
    { student_id: studentIds[2], parent_name: 'Tariq Malik', phone: '03003333333', whatsapp_number: '923003333333', relation: 'father', is_primary: true },
    { student_id: studentIds[3], parent_name: 'Noor Ahmed', phone: '03004444444', whatsapp_number: '923004444444', relation: 'father', is_primary: true },
    { student_id: studentIds[4], parent_name: 'Hassan Raza', phone: '03005555555', whatsapp_number: '923005555555', relation: 'father', is_primary: true },
    { student_id: studentIds[5], parent_name: 'Shah Nawaz', phone: '03006666666', whatsapp_number: '923006666666', relation: 'father', is_primary: true },
    { student_id: studentIds[6], parent_name: 'Farooq Ahmed', phone: '03007777777', whatsapp_number: '923007777777', relation: 'father', is_primary: true },
  ];
  await knex('student_contacts').insert(contacts);

  // Attendance (last 5 days)
  const dates = [];
  for (let i = 4; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }

  const statuses = ['P', 'P', 'P', 'A', 'P'];
  for (const d of dates) {
    const si = dates.indexOf(d);
    for (let j = 0; j < studentIds.length; j++) {
      const st = studentIds[j];
      const batchId = j < 5 ? batch1Id : batch2Id;
      await knex('attendance').insert({
        student_id: st,
        batch_id: batchId,
        date: d,
        status: j === 2 && si === 3 ? 'A' : statuses[si],
        marked_by: 'staff',
      }).onConflict(['student_id', 'date']).ignore();
    }
  }

  // Fees - generate for current and previous month
  const prevMonth = new Date();
  prevMonth.setDate(1); // Set to 1st to avoid overflow issues (e.g. Mar 29 -> Feb 29 doesn't exist)
  prevMonth.setMonth(prevMonth.getMonth() - 1);
  const prevMonthStr = prevMonth.toISOString().slice(0, 7);

  const feeData = [];
  for (const sid of studentIds) {
    const student = students[studentIds.indexOf(sid)];
    let discount = 0;
    if (student.discount_type === 'percent') {
      discount = (student.monthly_fee * student.discount_value) / 100;
    } else {
      discount = student.discount_value;
    }
    const amountDue = student.monthly_fee;
    const balance = amountDue - discount;

    // Previous month - paid
    feeData.push({
      student_id: sid, month_year: prevMonthStr,
      amount_due: amountDue, discount, amount_paid: balance,
      balance: 0, status: 'paid', payment_mode: 'cash',
      paid_date: prevMonthStr + '-10',
      receipt_no: `RCP-${prevMonthStr.replace('-','')}-${String(sid).padStart(3,'0')}`,
    });

    // Current month - pending for some, partial for others
    const isPaid = sid === studentIds[0];
    const isPartial = sid === studentIds[1];
    feeData.push({
      student_id: sid, month_year: currentMonth,
      amount_due: amountDue, discount,
      amount_paid: isPaid ? balance : isPartial ? Math.floor(balance / 2) : 0,
      balance: isPaid ? 0 : isPartial ? Math.ceil(balance / 2) : balance,
      status: isPaid ? 'paid' : isPartial ? 'partial' : 'pending',
      payment_mode: 'cash',
      paid_date: isPaid ? today : isPartial ? today : null,
      receipt_no: isPaid ? `RCP-${currentMonth.replace('-','')}-${String(sid).padStart(3,'0')}` : null,
    });
  }
  await knex('student_fees').insert(feeData);

  // Exams
  const [exam1] = await knex('exams').insert({
    batch_id: batch1Id, subject: 'Mathematics', exam_type: 'monthly',
    date: prevMonthStr + '-25', max_marks: 100, passing_marks: 40,
    description: 'Monthly Test March',
  });

  const [exam2] = await knex('exams').insert({
    batch_id: batch1Id, subject: 'Physics', exam_type: 'weekly',
    date: today, max_marks: 25, passing_marks: 10,
    description: 'Weekly Quiz',
  });

  // Exam Results
  const mathScores = [85, 92, 67, 78, 45, null, null];
  for (let i = 0; i < 5; i++) {
    await knex('exam_results').insert({
      exam_id: exam1,
      student_id: studentIds[i],
      marks_obtained: mathScores[i],
      is_absent: mathScores[i] === null,
    });
  }

  console.log('✅ Seed completed!');
  console.log(`   Batches: 2, Groups: 3, Students: ${studentIds.length}`);
  console.log(`   Attendance records: ${dates.length * studentIds.length}`);
  console.log(`   Fee records: ${feeData.length}`);
  console.log(`   Exams: 2`);
};
