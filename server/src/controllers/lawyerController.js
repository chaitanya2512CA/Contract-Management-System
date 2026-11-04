import crypto from 'crypto';
import { query } from '../config/db.js';

/**
 * Get Advocates Directory with Filtering & Sorting
 */
export const getLawyers = async (req, res) => {
  try {
    const {
      search,
      specialty,
      city,
      state,
      mode,
      verified,
      minExperience,
      maxFee,
      language,
      sortBy = 'rating', // 'rating', 'experience', 'fee_asc', 'fee_desc'
      page = 1,
      limit = 20,
    } = req.query;

    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const conditions = ['lp.is_verified = true OR lp.verification_status != $1'];
    const params = ['rejected'];

    let paramIndex = 2;

    if (search) {
      conditions.push(`(
        LOWER(lp.full_name) LIKE $${paramIndex} OR
        LOWER(lp.headline) LIKE $${paramIndex} OR
        LOWER(lp.primary_specialty) LIKE $${paramIndex} OR
        LOWER(lp.bio) LIKE $${paramIndex} OR
        LOWER(lp.city) LIKE $${paramIndex}
      )`);
      params.push(`%${search.trim().toLowerCase()}%`);
      paramIndex++;
    }

    if (specialty && specialty !== 'all') {
      conditions.push(`(
        LOWER(lp.primary_specialty) = LOWER($${paramIndex}) OR
        LOWER(lp.additional_specialties::text) LIKE $${paramIndex + 1}
      )`);
      params.push(specialty.trim());
      params.push(`%"${specialty.trim()}"%`);
      paramIndex += 2;
    }

    if (city) {
      conditions.push(`LOWER(lp.city) = LOWER($${paramIndex})`);
      params.push(city.trim());
      paramIndex++;
    }

    if (state) {
      conditions.push(`LOWER(lp.state) = LOWER($${paramIndex})`);
      params.push(state.trim());
      paramIndex++;
    }

    if (verified === 'true') {
      conditions.push(`lp.is_verified = true`);
    }

    if (minExperience) {
      conditions.push(`lp.experience_years >= $${paramIndex}`);
      params.push(parseInt(minExperience, 10));
      paramIndex++;
    }

    if (maxFee) {
      conditions.push(`lp.consultation_fee_30 <= $${paramIndex}`);
      params.push(parseFloat(maxFee));
      paramIndex++;
    }

    if (mode) {
      conditions.push(`lp.consultation_modes::text LIKE $${paramIndex}`);
      params.push(`%"${mode.trim()}"%`);
      paramIndex++;
    }

    if (language) {
      conditions.push(`LOWER(lp.languages::text) LIKE $${paramIndex}`);
      params.push(`%"${language.trim().toLowerCase()}"%`);
      paramIndex++;
    }

    let orderByClause = 'ORDER BY lp.rating_avg DESC, lp.total_consultations DESC';
    if (sortBy === 'experience') {
      orderByClause = 'ORDER BY lp.experience_years DESC';
    } else if (sortBy === 'fee_asc') {
      orderByClause = 'ORDER BY lp.consultation_fee_30 ASC';
    } else if (sortBy === 'fee_desc') {
      orderByClause = 'ORDER BY lp.consultation_fee_30 DESC';
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(
      `SELECT COUNT(*) FROM lawyer_profiles lp ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0].count, 10);

    const dataRes = await query(
      `SELECT
        lp.*,
        u.avatar,
        u.email,
        u.phone as contact_phone
      FROM lawyer_profiles lp
      JOIN users u ON lp.user_id = u.id
      ${whereClause}
      ${orderByClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, parseInt(limit, 10), offset]
    );

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)),
      lawyers: dataRes.rows,
    });
  } catch (error) {
    console.error('Error in getLawyers:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch advocates directory.' });
  }
};

/**
 * Get Lawyer Profile by ID with Availability, Reviews, and Services
 */
export const getLawyerById = async (req, res) => {
  try {
    const { id } = req.params;

    const lawyerRes = await query(
      `SELECT
        lp.*,
        u.avatar,
        u.email,
        u.phone as contact_phone,
        u.company_name
      FROM lawyer_profiles lp
      JOIN users u ON lp.user_id = u.id
      WHERE lp.id = $1 OR lp.user_id = $1`,
      [id]
    );

    if (lawyerRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Advocate profile not found.' });
    }

    const lawyer = lawyerRes.rows[0];

    // Fetch availability schedules
    const scheduleRes = await query(
      `SELECT * FROM availability_schedules WHERE lawyer_id = $1 AND is_active = true ORDER BY day_of_week ASC`,
      [lawyer.id]
    );

    // Fetch reviews
    const reviewsRes = await query(
      `SELECT
        cr.*,
        u.name as client_name,
        u.avatar as client_avatar
      FROM client_reviews cr
      JOIN users u ON cr.client_id = u.id
      WHERE cr.lawyer_id = $1
      ORDER BY cr.created_at DESC
      LIMIT 10`,
      [lawyer.id]
    );

    // Fetch legal services
    const servicesRes = await query(
      `SELECT * FROM legal_services WHERE lawyer_id = $1 AND is_active = true ORDER BY price_amount ASC`,
      [lawyer.id]
    );

    res.status(200).json({
      success: true,
      lawyer: {
        ...lawyer,
        schedules: scheduleRes.rows,
        reviews: reviewsRes.rows,
        services: servicesRes.rows,
      },
    });
  } catch (error) {
    console.error('Error in getLawyerById:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch advocate profile.' });
  }
};

/**
 * Update Current Lawyer Profile
 */
export const updateLawyerProfile = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const {
      headline,
      primarySpecialty,
      additionalSpecialties,
      experienceYears,
      barCouncilNumber,
      barState,
      languages,
      consultationFee15,
      consultationFee30,
      consultationFee60,
      consultationModes,
      bio,
      officeAddress,
      city,
      state,
      bankAccountNumber,
      bankIfsc,
      bankHolderName,
    } = req.body;

    const profileRes = await query(
      `UPDATE lawyer_profiles SET
        headline = COALESCE($1, headline),
        primary_specialty = COALESCE($2, primary_specialty),
        additional_specialties = COALESCE($3, additional_specialties),
        experience_years = COALESCE($4, experience_years),
        bar_council_number = COALESCE($5, bar_council_number),
        bar_state = COALESCE($6, bar_state),
        languages = COALESCE($7, languages),
        consultation_fee_15 = COALESCE($8, consultation_fee_15),
        consultation_fee_30 = COALESCE($9, consultation_fee_30),
        consultation_fee_60 = COALESCE($10, consultation_fee_60),
        consultation_modes = COALESCE($11, consultation_modes),
        bio = COALESCE($12, bio),
        office_address = COALESCE($13, office_address),
        city = COALESCE($14, city),
        state = COALESCE($15, state),
        bank_account_number = COALESCE($16, bank_account_number),
        bank_ifsc = COALESCE($17, bank_ifsc),
        bank_holder_name = COALESCE($18, bank_holder_name),
        updated_at = NOW()
      WHERE user_id = $19
      RETURNING *`,
      [
        headline,
        primarySpecialty,
        additionalSpecialties ? JSON.stringify(additionalSpecialties) : null,
        experienceYears ? Number(experienceYears) : null,
        barCouncilNumber,
        barState,
        languages ? JSON.stringify(languages) : null,
        consultationFee15 ? Number(consultationFee15) : null,
        consultationFee30 ? Number(consultationFee30) : null,
        consultationFee60 ? Number(consultationFee60) : null,
        consultationModes ? JSON.stringify(consultationModes) : null,
        bio,
        officeAddress,
        city,
        state,
        bankAccountNumber,
        bankIfsc,
        bankHolderName,
        userId,
      ]
    );

    if (profileRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Lawyer profile not found for current user.' });
    }

    res.status(200).json({
      success: true,
      message: 'Advocate profile updated successfully.',
      profile: profileRes.rows[0],
    });
  } catch (error) {
    console.error('Error in updateLawyerProfile:', error);
    res.status(500).json({ success: false, message: 'Failed to update lawyer profile.' });
  }
};

/**
 * Update Availability Schedules
 */
export const updateAvailability = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { schedules } = req.body; // Array of { day_of_week, start_time, end_time, is_active }

    const lawyerRes = await query('SELECT id FROM lawyer_profiles WHERE user_id = $1', [userId]);
    if (lawyerRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Lawyer profile not found.' });
    }
    const lawyerId = lawyerRes.rows[0].id;

    if (Array.isArray(schedules)) {
      await query('DELETE FROM availability_schedules WHERE lawyer_id = $1', [lawyerId]);
      for (const s of schedules) {
        await query(
          `INSERT INTO availability_schedules (id, lawyer_id, day_of_week, start_time, end_time, is_active)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            crypto.randomUUID(),
            lawyerId,
            Number(s.day_of_week),
            s.start_time || '09:00',
            s.end_time || '18:00',
            s.is_active !== false,
          ]
        );
      }
    }

    const updated = await query(
      'SELECT * FROM availability_schedules WHERE lawyer_id = $1 ORDER BY day_of_week ASC',
      [lawyerId]
    );

    res.status(200).json({
      success: true,
      message: 'Availability schedule saved.',
      schedules: updated.rows,
    });
  } catch (error) {
    console.error('Error in updateAvailability:', error);
    res.status(500).json({ success: false, message: 'Failed to update availability schedule.' });
  }
};
