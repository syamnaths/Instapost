const creativeTypeDimensions = {
    "Square Post": { 
        size: "1080 x 1080 px (1:1)", 
        scale: "Balanced centered scaling",
        block_heights: { header: "20%", hero: "60%", footer: "20%" }
    },
    "Portrait Post": { 
        size: "1080 x 1350 px (4:5)", 
        scale: "Vertical emphasis with larger Hook area",
        block_heights: { header: "20%", hero: "60%", footer: "20%" }
    },
    "Reel/Story": { 
        size: "1080 x 1920 px (9:16)", 
        scale: "Dynamic vertical scaling, prioritized top-third Hook placement",
        block_heights: { header: "25%", hero: "50%", footer: "25%" } // More breathing room for UI
    }
};

function toTitleCase(str) {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function toSentenceCase(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function isGroupMode(data) {
    // 1. Check Festive/Auto Mode subjects
    const subjects = ['subject_men', 'subject_women', 'subject_kids'];
    const count = subjects.filter(cat => data[cat] === 'on' || data[cat] === true).length;
    
    // 2. Check Artisan Collection size
    const artisanCount = data.artisan_collection ? data.artisan_collection.length : 0;
    
    // 3. Fallback to comma detection if structured data is missing
    const hasMultipleUrls = !!(data.dress_reference && data.dress_reference.includes(','));
    
    return count > 1 || artisanCount > 1 || hasMultipleUrls;
}

function deriveGridStrategy(data) {
    const groupMode = isGroupMode(data);
    
    let negativeSpaceAnchor = groupMode ? "None (Full Width Group)" : 3;
    let activeColumns = groupMode ? [1, 2, 3] : [1, 2];

    return {
        spatial_rule: "Rule of Thirds / Asymmetrical 2-of-3",
        group_mode: groupMode,
        active_columns: activeColumns,
        negative_space_anchor: negativeSpaceAnchor,
        grid_logic: groupMode 
            ? "Full-width Hero block utilized to accommodate multiple subjects in a balanced group composition."
            : "Content uses an editorial two-column balance with one clear area for the campaign headline.",
        micro_grid: {
            footer: {
                columns: 3,
                logic: "Distribute contact details across a 3-column sub-grid. Implement content-aware wrapping for long strings (emails/locations)."
            }
        }
    };
}

function deriveContextualAesthetic(data) {
    const campaign = data.festive_info || data.hook || data.event_offer || 'Srishti Campus campaign';
    const visualDirection = data.visual_direction || 'Cinematic campus story';
    if (data.festive_mode === 'on' && data.festive_info) {
        return {
            context: `${data.festive_info} campus campaign`,
            aesthetic: `Srishti Campus communication for ${data.festive_info}. Use ${visualDirection.toLowerCase()} storytelling with authentic students, instructors, learning, technology, or Kerala campus details as relevant.`,
            mood: "aspirational, youthful, confident, and welcoming",
            colors: "Srishti signature blue with white and deep charcoal; use campaign colors only as restrained accents"
        };
    }

    if (data.dress_reference) {
        return {
            context: "Visual Anchor Reference Matching",
            aesthetic: "Srishti Campus campaign photography. Match the reference subject and context faithfully while applying clean, confident campus communications design.",
            mood: "aspirational, youthful, confident, and authentic",
            colors: "Srishti signature blue, white, and charcoal with restrained campaign accents"
        };
    }

    if (data.hook || data.event_offer) {
        const contextSubject = (data.hook || data.event_offer).toUpperCase();
        return {
            context: `Retail Commercial - ${contextSubject}`,
            aesthetic: `Create a ${visualDirection.toLowerCase()} for ${campaign}. Connect education, technology, student life, and career outcomes with authentic, locally grounded imagery.`,
            mood: "aspirational, youthful, confident, and welcoming",
            colors: "Srishti signature blue with white and deep charcoal; use campaign colors only as restrained accents"
        };
    }

    return {
        context: `Srishti Campus campaign: ${campaign}`,
        aesthetic: `Create a ${visualDirection.toLowerCase()} for Srishti Campus. Use authentic students, instructors, campus, technology, or career outcomes as appropriate to the message.`,
        mood: "aspirational, youthful, confident, and welcoming",
        colors: "Srishti signature blue with white and deep charcoal; use campaign colors only as restrained accents"
    };
}

function generatePromptText(data) {
    if (!data) return "Error: No input data provided.";
    
    const dim = creativeTypeDimensions[data.creative_type] || creativeTypeDimensions["Square Post"];
    const aesthetic = deriveContextualAesthetic(data);
    const grid = deriveGridStrategy(data);
    
    const iconGridSystem = "Utilize a uniform grid-based vector icon system (24x24px scale) for all contact symbols and the Instagram glyph to ensure visual consistency and perfect alignment.";
    
    const contactIcons = [];
    if (data.phone) contactIcons.push(`Phone glyph: ${data.phone}`);
    if (data.whatsapp) contactIcons.push(`WhatsApp glyph: ${data.whatsapp}`);
    if (data.email) contactIcons.push(`Email glyph: ${data.email}`);
    if (data.address) contactIcons.push(`Campus address: ${data.address}`);
    if (data.website) contactIcons.push(`Website: ${data.website}`);
    const contactStr = contactIcons.join(' | ') || "";

    // Subject mapping (Aggregate from active anchor)
    const selectedSubjects = [];
    const mode = data.anchor_mode;
    if (mode === 'festive' || mode === 'ai') {
        if (data.subject_women === 'on' || data.subject_women === true) selectedSubjects.push("Students");
        if (data.subject_men === 'on' || data.subject_men === true) selectedSubjects.push("Educators");
        if (data.subject_kids === 'on' || data.subject_kids === true) selectedSubjects.push("Campus community");
    } else if (data.artisan_collection && data.artisan_collection.length > 0) {
        // The image model will identify who or what each reference depicts.
    } else if (data.dress_reference) {
        // Fallback for simple single-URL Artisan mode
        selectedSubjects.push("Student");
    }
    
    const subjectList = selectedSubjects.length > 0 ? selectedSubjects.join(' and ') : "South Asian Indian students and educators";

    // Regional Casting Nuance
    const region = data.location_details ? `${data.location_details}, India` : "India";
    const regionalCastingDirective = `Use authentic, diverse South Asian Indian students and educators appropriate to ${region}; represent real campus life naturally without stereotypes.`;

    // Artisan Mapping Directive
    let collectionMappingDirective = "";
    if (data.artisan_collection && data.artisan_collection.length > 1) {
        const mappings = data.artisan_collection.map((item, index) => `Reference ${index + 1} -> URL: ${item.url}`).join(' | ');
        collectionMappingDirective = `\n  "ARTISAN_COLLECTION_MAPPING": "${mappings}",`;
    }

    // Wardrobe Lock Strategy Integration
    let wardrobeLockBlock = "";
    let globalPriorityBlock = "";
    let antiDriftRules = "";
    let garmentFocus = "";

        // Dress Reference Handling
        let wardrobeSource;
        if ((data.anchor_mode === 'festive' && data.festive_info) || data.anchor_mode === 'ai') {
            wardrobeSource = `Use contemporary, appropriate student or educator clothing. Reflect the ${data.festive_info} campaign context without fashion-ad styling.`;
        } else {                const isDirectUpload = data.artisan_direct_upload === 'on' || data.artisan_direct_upload === true;
                const refLabel = isDirectUpload && !data.dress_reference ? "image uploaded" : (data.dress_reference || "");
                const refText = refLabel ? `(Reference: ${refLabel})` : '';
                
                if (refLabel) {
                    globalPriorityBlock = `\n  "GLOBAL_RENDER_PRIORITY": {    "order_of_importance": [
      "WARDROBE_FIDELITY",
      "FACE_REALISM",
      "TEXT_READABILITY",
      "SCENE_STYLING"
    ],
    "rule": "Higher priority items override lower priority styling instructions."
  },`;

            wardrobeLockBlock = `${collectionMappingDirective}\n  "REFERENCE_FIDELITY": {
    "priority": "MAXIMUM — IDENTIFY AND PRESERVE REFERENCE CONTENT",
    "rule": "Inspect each supplied reference and automatically identify whether it depicts a student, instructor, campus location, class, event, or other relevant subject. Use each reference according to its visible content; preserve recognizable people and relevant campus or event context.",
    "requirements": {
      "identity": "Do not alter recognizable student or educator identity.",
      "setting": "Retain relevant campus, classroom, event, and signage context.",
      "color_accuracy": "Retain important reference colors and campaign details."
    },
    "reference_image": "${data.dress_reference || (isDirectUpload ? 'image uploaded' : '')}",
    "anchored_attributes": {
      "identity": "Preserve recognizable people where applicable",
      "setting": "Preserve campus and event context",
      "surface_details": "Keep important reference details intact."
    },
    "hard_constraints": [
      "do not invent people, campus signs, or institutional logos",
      "do not alter factual campaign copy",
      "do not distort or recreate the Srishti logo"
    ],
    "hard_failure_rule": "If identity, logo, or text cannot be rendered accurately, leave a clean area for final typesetting or asset placement."
  },`;

            wardrobeSource = `Automatically identify what the supplied reference depicts, then preserve relevant people, campus details, and event context. ${refText}`;

            antiDriftRules = `\n      "anti_drift_rules": [
        "do not alter recognizable people",
        "do not replace relevant campus context",
        "do not fabricate institutional signage",
        "preserve important details and colors from the reference"
      ],`;

            garmentFocus = `\n      "reference_focus": "Keep important people, campus setting, or event details from the supplied references clearly visible.",`;
        } else {
            wardrobeSource = `Automatically identify what the supplied reference depicts and use it as the appropriate person, campus, or event reference. Preserve relevant people, setting, and key details.`;
        }
    }

    const logoInstruction = `\n  "LOGO_INTEGRATION": {
    "is_logo_mandatory": true,
    "light_logo_asset": "${data.logo_light || 'logo/Srishti campus light ogo.png'}",
    "dark_logo_asset": "${data.logo_dark || 'logo/Srishti campus logo 4.19.44 PM.png'}",
    "usage_rule": "Use the light logo on dark backgrounds and the dark logo on light backgrounds. Both are official Srishti Campus assets.",
    "sizing_rule": "Keep the logo clearly legible at social-media size while respecting its original proportions and clear space.",
    "alignment_strategy": "Place it near the top edge with safe margins, away from faces and important copy.",
    "rendering_instruction": "Use the supplied campus logo as-is. Never redraw, approximate, distort, crop, or replace it. If accurate image placement is not supported, leave a clean area for manual placement."
  },`;

    // Capitalization handling
    const brandName = toTitleCase(data.brand || 'Brand Name');
    
    // Robust check for AI Content Mode
    const isAICopyActive = data.ai_content_mode === 'on' || data.ai_content_mode === true;
    
    // Explicitly derive final text for placeholders
    const language = data.campaign_language || 'English';
    const finalHook = isAICopyActive 
        ? `MANDATORY: Suggest a concise, credible Srishti Campus headline in ${language}. Focus on education, skills, student achievement, admissions, or career outcomes as relevant. Do not invent dates, claims, rankings, or guarantees.` 
        : (data.hook || 'Headline');

    const finalOffer = isAICopyActive 
        ? `MANDATORY: Suggest concise supporting campaign copy in ${language}. Do not invent dates, course names, fees, contact details, placement claims, or guarantees.` 
        : toSentenceCase(data.event_offer || 'Promotional Offer');

    return `Create a high-fidelity image based on the JSON-BASED DESIGN SPECIFICATION:
{
  "creative_type": "${data.creative_type || 'Social Media Post'}",${globalPriorityBlock}${wardrobeLockBlock}${logoInstruction}
  "dimensions": "${dim.size}",
  "aspect_ratio_constraint": "Strictly maintain aspect ratio without cropping",
  "composition_grid": {
    "spatial_rule": "${grid.spatial_rule}",
    "group_mode": ${grid.group_mode},
    "active_columns": [${grid.active_columns.join(', ')}],
    "negative_space_anchor": "${grid.negative_space_anchor}",
    "block_heights": {
      "header": "${dim.block_heights.header}",
      "hero": "${dim.block_heights.hero}",
      "footer": "${dim.block_heights.footer}"
    },
    "logic": "${grid.grid_logic}",
    "micro_grid": {
      "footer_columns": ${grid.micro_grid.footer.columns},
      "footer_logic": "${grid.micro_grid.footer.logic}"
    }
  },
  "design_blueprint": {
    "context": "${aesthetic.context}",
    "mood": "${aesthetic.mood}",
    "aesthetic_directives": "${aesthetic.aesthetic}",
    "color_strategy": "${aesthetic.colors}",
    "custom_aesthetic_notes": "${data.custom_styling || ''}",
    "note": "Custom visual notes should support the Srishti campaign and must not override exact supplied copy or logo requirements."
  },
  "layout_standards": {
    "header_block": {
      "content": "Brand Identity and Attention Hook",
      "alignment": "Use confident editorial alignment, with clear space for the campus logo and headline. Keep all important text inside platform-safe margins."
    },
    "hero_block": {
      "content": "Student, educator, campus, or campaign visual",
      "alignment": "${grid.group_mode ? 'Balanced campus group composition spanning active columns' : 'Strong single focal subject with room for campaign copy'}",
      "protection": "Ensure hero element remains unobstructed by text or effects"
    },
    "footer_block": {
      "content": "Marketing Offer and Contact Details",
      "alignment": "Bottom-aligned, utilize sub-grid for data points",
      "wrapping_rules": "Content-aware wrapping: long strings must wrap within column bounds or span maximum 2 columns."
    }
  },
  "style": {
    "visual_elements": {
      "hero_element": "${data.anchor_mode === 'artisan' && data.artisan_collection?.length ? 'Use each supplied reference according to its automatically identified content: student, instructor, campus, class, or event.' : (grid.group_mode ? 'Authentic South Asian Indian campus community: ' + subjectList : 'Authentic South Asian Indian student, educator, or campus scene: ' + subjectList)}",${garmentFocus}
      "background_strategy": "Build an original campus, learning, technology, or career context appropriate to '${aesthetic.context}'. Reference images may guide identity and setting, but do not fabricate campus signage or logos.",
      "icon_standard": "${iconGridSystem}"
    },
    "model_direction": {
      "appearance": "Authentic, diverse South Asian Indian students and educators with natural expressions and realistic appearance.",
      "regional_casting_nuance": "${regionalCastingDirective}",
      "camera_specs": "Natural editorial campus photography, realistic skin texture, clean lighting, and authentic settings. Use portrait framing for individual stories and wide framing for campus groups.",
      "pose_style": "${grid.group_mode ? 'Natural, engaged group interaction with believable campus energy' : 'Confident, approachable, candid or composed to suit the campaign'}",
      "expression": "Confident, optimistic, credible, and approachable",
      "wardrobe_source": "${data.anchor_mode === 'artisan' ? wardrobeSource : 'Use realistic student and educator clothing appropriate to a contemporary Kerala campus. Avoid fashion-campaign styling.'}"
    },
    "typography_style": {
      "hierarchy": "Srishti logo > campaign headline > supporting copy > CTA or course/event details > contact > website/social",
      "alignment": "Balanced asymmetrical alignment based on active grid columns",
      "responsive_scaling": "${dim.scale}",
      "readability_rules": {
        "contrast_ratio": "minimum 7:1 contrast ratio (WCAG AAA)",
        "mobile_first_legibility": true
      }
    },
    "finish": {
      "quality": "Polished, believable campus campaign photography with modern clarity, natural people, and restrained effects.",
      "overall_feel": "Recognizable Srishti Campus communication: aspirational, technology-aware, locally grounded, and easy to read at social-media size"
    }
  },
  "content_placeholders": {
    "brand_logo": "Use the official Srishti Campus logo variant with appropriate contrast: light logo ${data.logo_light || 'logo/Srishti campus light ogo.png'} on dark backgrounds, dark logo ${data.logo_dark || 'logo/Srishti campus logo 4.19.44 PM.png'} on light backgrounds. Preserve proportions and clear space; never redraw, distort, crop, or replace either asset.",
    "hook": "${finalHook}",
    "brand_name": "${brandName}",
    "event_offer": "${finalOffer}",
    "location_details": "${data.location_details || 'Location'}",
    "campus_address": "${data.address || ''}",
    "contact_details": "${contactStr}",
    "website": "${data.website || 'https://www.srishticampus.in'}",
    "instagram_handle": "${data.social_handles || 'Srishti Campus social handle if supplied'} with a simple, aligned social mark",
    "campaign_language": "${language}",
    "exact_copy_rule": "Render supplied headline and details exactly. For Malayalam or bilingual copy, preserve the provided text; if the image model cannot render it accurately, leave a clean text area for final typesetting. Do not invent factual claims.",
    "srishti_brand_guide": "Signature Srishti blue, white and charcoal palette; bold high-impact headline with clean supporting typography; aspirational education, technology, student-life and career imagery; consistent safe-margin logo placement; website/contact footer when provided."
  }
}`;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generatePromptText };
}
