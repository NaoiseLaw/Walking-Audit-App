-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for routes table
CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON routes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for audits table
CREATE TRIGGER update_audits_updated_at BEFORE UPDATE ON audits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for issues table
CREATE TRIGGER update_issues_updated_at BEFORE UPDATE ON issues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for recommendations table
CREATE TRIGGER update_recommendations_updated_at BEFORE UPDATE ON recommendations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate audit scores
CREATE OR REPLACE FUNCTION calculate_audit_scores()
RETURNS TRIGGER AS $$
DECLARE
    v_total_score INTEGER;
    v_max_score INTEGER;
    v_normalized_score DECIMAL;
    v_walkability_rating TEXT;
    v_footpaths_score INTEGER;
    v_facilities_score INTEGER;
    v_crossings_score INTEGER;
    v_behaviour_score INTEGER;
    v_safety_score INTEGER;
    v_look_feel_score INTEGER;
    v_school_gates_score INTEGER;
BEGIN
    -- Get section scores
    SELECT score INTO v_footpaths_score FROM audit_sections 
    WHERE audit_id = NEW.audit_id AND section = 'footpaths';
    
    SELECT score INTO v_facilities_score FROM audit_sections 
    WHERE audit_id = NEW.audit_id AND section = 'facilities';
    
    SELECT score INTO v_crossings_score FROM audit_sections 
    WHERE audit_id = NEW.audit_id AND section = 'crossing_road';
    
    SELECT score INTO v_behaviour_score FROM audit_sections 
    WHERE audit_id = NEW.audit_id AND section = 'road_user_behaviour';
    
    SELECT score INTO v_safety_score FROM audit_sections 
    WHERE audit_id = NEW.audit_id AND section = 'safety';
    
    SELECT score INTO v_look_feel_score FROM audit_sections 
    WHERE audit_id = NEW.audit_id AND section = 'look_and_feel';
    
    SELECT score INTO v_school_gates_score FROM audit_sections 
    WHERE audit_id = NEW.audit_id AND section = 'school_gates';
    
    -- Calculate total score
    v_total_score := COALESCE(v_footpaths_score, 0) + 
                     COALESCE(v_facilities_score, 0) + 
                     COALESCE(v_crossings_score, 0) + 
                     COALESCE(v_behaviour_score, 0) + 
                     COALESCE(v_safety_score, 0) + 
                     COALESCE(v_look_feel_score, 0) + 
                     COALESCE(v_school_gates_score, 0);
    
    -- Calculate max possible score
    v_max_score := 7 * 5; -- 7 sections, max 5 points each
    
    -- Calculate normalized score
    v_normalized_score := CASE 
        WHEN v_max_score > 0 THEN v_total_score::DECIMAL / v_max_score::DECIMAL 
        ELSE 0 
    END;
    
    -- Determine walkability rating
    v_walkability_rating := CASE
        WHEN v_normalized_score >= 0.8 THEN 'Excellent'
        WHEN v_normalized_score >= 0.6 THEN 'Good'
        WHEN v_normalized_score >= 0.4 THEN 'OK'
        WHEN v_normalized_score >= 0.2 THEN 'Fair'
        ELSE 'Poor'
    END;
    
    -- Update audit
    UPDATE audits SET
        footpaths_score = v_footpaths_score,
        facilities_score = v_facilities_score,
        crossings_score = v_crossings_score,
        behaviour_score = v_behaviour_score,
        safety_score = v_safety_score,
        look_feel_score = v_look_feel_score,
        school_gates_score = v_school_gates_score,
        total_score = v_total_score,
        max_possible_score = v_max_score,
        normalized_score = v_normalized_score,
        walkability_rating = v_walkability_rating
    WHERE id = NEW.audit_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to calculate audit scores when sections are updated
CREATE TRIGGER calculate_audit_scores_trigger
AFTER INSERT OR UPDATE ON audit_sections
FOR EACH ROW
EXECUTE FUNCTION calculate_audit_scores();

