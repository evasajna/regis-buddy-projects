-- Remove jobcard category and add others category
DELETE FROM employment_categories WHERE name = 'jobcard';

INSERT INTO employment_categories (name, description, is_active) 
VALUES ('others', 'For applicants with special qualifications who can apply to all programs', true);