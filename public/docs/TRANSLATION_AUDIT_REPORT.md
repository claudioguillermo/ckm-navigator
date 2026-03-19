# Comprehensive Translation Audit Report
## EMPOWER-CKM Navigator - Portuguese (pt.json) and Spanish (es.json)
### Date: January 20, 2026

---

## Executive Summary

This audit evaluates the Portuguese and Spanish translations against the English base file (`en.json`) for translational accuracy, grammatical correctness, and medical terminology consistency.

### Overall Assessment

| Language | Overall Grade | Critical Issues | Major Issues | Minor Issues |
|----------|---------------|-----------------|--------------|--------------|
| **Portuguese (pt.json)** | **A-** (Excellent) | 0 | 2 | 8 |
| **Spanish (es.json)** | **D** (Needs Significant Work) | 3 | 7 | 12 |

---

## CRITICAL ISSUES (Must Fix Immediately)

### Spanish (es.json) - WRONG LANGUAGE CONTENT

**CRITICAL-ES-001**: Lines 37-42 - Entire `clinic` section contains PORTUGUESE text instead of Spanish

```json
"missionText": "EMPOWER-CKM é mais do que apenas uma ferramenta—é uma iniciativa centrada no paciente criada pelos seus médicos..."
"teamTitle": "Conheça Seus Médicos Residentes",
"teamText": "No MetroWest Medical Center, nossos Médicos Residentes estão no coração de nossa clínica ambulatorial..."
"teamLink": "Saiba mais sobre nosso programa de residência",
"appointmentTitle": "Agendar uma Consulta",
"appointmentDesc": "Fale com nossa equipe para discutir sua saúde cardiometabólica."
```

**Should be (Spanish)**:
```json
"missionText": "EMPOWER-CKM es más que una herramienta—es una iniciativa centrada en el paciente creada por sus médicos...",
"teamTitle": "Conozca a Sus Médicos Residentes",
"teamText": "En MetroWest Medical Center, nuestros Médicos Residentes están en el corazón de nuestra clínica ambulatoria...",
"teamLink": "Conozca más sobre nuestro programa de residencia",
"appointmentTitle": "Programar una Cita",
"appointmentDesc": "Hable con nuestro equipo para discutir su salud cardiometabólica."
```

**CRITICAL-ES-002**: Line 178 - `staging.plan.lifestyleActions.diet` contains PORTUGUESE text

```json
"diet": "<strong>Nutricao:</strong> Substitua uma refeicao processada por dia por alimentos integrais. Reduza o sodio oculto."
```

**Should be (Spanish)**:
```json
"diet": "<strong>Nutrición:</strong> Sustituya una comida procesada al día por alimentos integrales. Reduzca el sodio oculto."
```

**CRITICAL-ES-003**: Line 76 - Mixed Portuguese word in Spanish text

```json
"connection": "Los riñones dañados no pueden filtrar la sangre adecuadamente, lo que provoca una acumulação de toxinas..."
```

**Issue**: "acumulação" is Portuguese; should be "acumulación" (Spanish)

---

## MAJOR ISSUES

### Portuguese (pt.json)

**MAJOR-PT-001**: Line 22 - Spanish word in Portuguese text
```json
"resetProgress": "Redefinir Progreso"
```
**Should be**: "Redefinir Progresso" (Portuguese uses double 's')

**MAJOR-PT-002**: Regional variation inconsistency
The Portuguese translation uses Brazilian Portuguese (PT-BR) conventions, which is appropriate for the target audience. However, some European Portuguese (PT-PT) forms appear sporadically. Recommend full standardization to PT-BR.

### Spanish (es.json)

**MAJOR-ES-001**: Line 286 - Portuguese word in Spanish text
```json
"content": "...fortaleciendo sus \"mitocôndrias\" (las centrales energéticas de sus células)."
```
**Should be**: "mitocondrias" (Spanish spelling, no circumflex)

**MAJOR-ES-002**: Line 287 - Portuguese word in Spanish text
```json
"expanded": "...Mejora la \"flexibilidade metabólica\"..."
```
**Should be**: "flexibilidad metabólica" (Spanish)

**MAJOR-ES-003**: Line 845 - Portuguese word in Spanish text
```json
"lesson": "...Progresso, no perfección."
```
**Should be**: "Progreso, no perfección." (Spanish uses single 's')

**MAJOR-ES-004**: Line 880 - Portuguese word in Spanish text
```json
"text": "...Toma 30 segundos revisar uma etiqueta..."
```
**Should be**: "...Toma 30 segundos revisar una etiqueta..." ("uma" is Portuguese, "una" is Spanish)

**MAJOR-ES-005**: Line 1000 - Portuguese verb form in Spanish text
```json
"text": "...Gastam millones para engañarlo..."
```
**Should be**: "...Gastan millones para engañarlo..." ("Gastam" is Portuguese, "Gastan" is Spanish)

**MAJOR-ES-006**: Line 1104 - Portuguese conjunction in Spanish text
```json
"desc": "Índice de Masa Corporal basado en altura e peso."
```
**Should be**: "...basado en altura y peso." ("e" is Portuguese, "y" is Spanish)

**MAJOR-ES-007**: Missing translation - Several instances where Portuguese text fragments remain embedded in otherwise Spanish content, suggesting copy-paste errors during translation process.

---

## MINOR ISSUES

### Portuguese (pt.json)

**MINOR-PT-001**: Inconsistent accent usage
- Line 411: "Couve, Chuchu, Jiló, Maxixe" - correct
- Some medical terms lack proper accents

**MINOR-PT-002**: Informal vs. formal address inconsistency
- Most content uses "você" (informal/neutral Brazilian)
- Some sections switch to more formal constructions
- Recommend standardizing to "você" throughout for consistency

**MINOR-PT-003**: Line 377 - Reference to MassHealth
- "O MassHealth eliminou os copagamentos em 2024"
- Correct localization for Massachusetts audience
- Consider adding Portuguese-language resources for Portuguese-speaking patients

**MINOR-PT-004**: Line 858 - Regional reference
- "Natick Mall ou Shoppers World"
- Appropriate for local Massachusetts audience

**MINOR-PT-005**: Some medical abbreviations not localized
- "SGLT2i", "GLP-1" - correctly kept in English (international standard)
- "DRC" for "Doença Renal Crônica" - correct PT-BR translation of CKD

**MINOR-PT-006**: Line 251 - Minor redundancy
- "O que você come é o remédio mais potente" - correct but could be slightly more idiomatic

**MINOR-PT-007**: Numerical formatting
- Uses period as decimal separator (correct for PT-BR)
- Consistent throughout

**MINOR-PT-008**: Line 341 - Cultural myth well-adapted
- "'Diabetes é de susto ou raiva'" - excellent cultural adaptation addressing common Brazilian/Latin American myth

### Spanish (es.json)

**MINOR-ES-001**: Inconsistent use of "usted" vs. "tú"
- File predominantly uses "usted" (formal), which is appropriate for medical education
- Some instances of informal constructions slip through
- Recommend full standardization to "usted" form

**MINOR-ES-002**: Line 166 - Awkward phrasing
```json
"title": "Su Hoja de Roadmap CKM"
```
**Suggest**: "Su Hoja de Ruta CKM" or "Su Plan de Acción CKM" (avoid Spanglish)

**MINOR-ES-003**: Line 427 - Minor grammatical issue
```json
"title": "Un Cuarto del Plato-Granos e Carbohidratos"
```
**Should be**: "Un Cuarto del Plato-Granos y Carbohidratos" (Spanish uses "y" not "e" before consonants; "e" only used before words starting with "i-" or "hi-")

**MINOR-ES-004**: Line 937 - Typo
```json
"text": "...Regera: 5% o menos es BAJO..."
```
**Should be**: "Regla:" (typo)

**MINOR-ES-005**: Line 926 - Minor inconsistency
```json
"text": "CRÍTICO. Limite a <25g/dietas."
```
**Should be**: "...Limite a <25g/día." ("dietas" is incorrect)

**MINOR-ES-006**: Regional Spanish variants
- Uses neutral Latin American Spanish, appropriate for US Hispanic audience
- Some Iberian Spanish constructions appear occasionally
- Recommend standardizing to Latin American Spanish

**MINOR-ES-007**: Line 163 - Term translation
- "infarto" vs "ataque cardíaco" - both acceptable, but inconsistent usage
- Stage 4 uses "infarto", elsewhere uses "ataque cardíaco"

**MINOR-ES-008**: Punctuation inconsistencies
- Some sentences missing inverted question marks (¿) or exclamation marks (¡)
- Example: Line 341: "'La diabetes es del susto o coraje'-MITO." (should have ¿ if phrased as question)

**MINOR-ES-009**: Line 863 - Anglicism
- "snacks de movimiento" - acceptable colloquial usage but could be "refrigerios de movimiento"

**MINOR-ES-010**: Line 1008 - Cultural term
- "'Sano para el Corazón'" - correct translation of "Heart Healthy" marketing claim

**MINOR-ES-011**: Numerical formatting
- Consistent use of period as decimal separator (US Spanish convention)
- Appropriate for US-based audience

**MINOR-ES-012**: Line 823 - Term choice
- "ictus" (Iberian) vs "derrame cerebral" or "ACV" (Latin American)
- Line 163 uses "infarto" which is more common in Latin America
- Recommend consistency with Latin American terminology

---

## MEDICAL TERMINOLOGY ASSESSMENT

### Portuguese Medical Terms - Grade: A

| English Term | Portuguese Translation | Assessment |
|-------------|----------------------|------------|
| Chronic Kidney Disease | Doença Renal Crônica (DRC) | Correct |
| Heart Failure | Insuficiência Cardíaca | Correct |
| Type 2 Diabetes | Diabetes Tipo 2 | Correct |
| Blood Pressure | Pressão Arterial | Correct |
| HbA1c | HbA1c | Correct (kept as international) |
| eGFR | eGFR | Correct (kept as international) |
| UACR | UACR | Correct (kept as international) |
| LDL Cholesterol | Colesterol LDL | Correct |
| ApoB | ApoB | Correct |
| SGLT2 inhibitors | Inibidores de SGLT-2 | Correct |
| GLP-1 agonists | Agonistas de GLP-1 | Correct |
| ACE inhibitors | Inibidores da ECA | Correct |
| ARBs | BRAs | Correct (Bloqueadores dos Receptores da Angiotensina) |
| Beta-blockers | Beta-Bloqueadores | Correct |
| Statins | Estatinas | Correct |
| Metformin | Metformina | Correct |
| Insulin resistance | Resistência à insulina | Correct |
| Nephrons | Néfrons | Correct |

### Spanish Medical Terms - Grade: B+

| English Term | Spanish Translation | Assessment |
|-------------|---------------------|------------|
| Chronic Kidney Disease | Enfermedad Renal Crónica (ERC) | Correct |
| Heart Failure | Insuficiencia Cardíaca | Correct |
| Type 2 Diabetes | Diabetes Tipo 2 | Correct |
| Blood Pressure | Presión Arterial | Correct |
| HbA1c | HbA1c | Correct |
| eGFR | eGFR | Correct |
| UACR | UACR | Correct |
| LDL Cholesterol | Colesterol LDL | Correct |
| ApoB | ApoB | Correct |
| SGLT2 inhibitors | Inhibidores de SGLT-2 | Correct |
| GLP-1 agonists | Agonistas de GLP-1 | Correct |
| ACE inhibitors | Inhibidores de la ECA | Correct |
| ARBs | ARA II | Correct (Antagonistas de los Receptores de Angiotensina II) |
| Beta-blockers | Beta-Bloqueadores | Correct |
| Statins | Estatinas | Correct |
| Metformin | Metformina | Correct |
| Insulin resistance | Resistencia a la insulina | Correct |
| Nephrons | Nefronas | Correct |

**Note**: Spanish version correctly uses "ARA II" which is the standard Spanish medical abbreviation (vs. Portuguese "BRA"). However, some documents also use "BRA" in Spanish contexts.

---

## CULTURAL ADAPTATION ASSESSMENT

### Portuguese - Grade: A

**Strengths**:
1. Excellent adaptation of cultural food examples (arroz e feijão, picanha, farofa)
2. Brazilian cultural myths well-addressed ("Diabetes é de susto ou raiva")
3. Appropriate use of informal "você" for patient education
4. Local Massachusetts references (MassHealth, Natick Mall) maintained
5. Brazilian vegetables mentioned (chuchu, jiló, maxixe)

**Recommendations**:
- Add more Cape Verdean and Azorean food references for broader Portuguese-speaking community reach

### Spanish - Grade: B

**Strengths**:
1. Good adaptation of Latin American foods (tacos, pupusas, tortillas, nopales)
2. Cultural myths addressed ("diabetes del susto o coraje")
3. Appropriate formal "usted" for medical context
4. Salvadoran foods included (pupusas, curtido)
5. Mexican vegetables mentioned (nopales, tomatillos, calabacitas)

**Weaknesses**:
1. Portuguese text contamination undermines cultural authenticity
2. Some Iberian Spanish terms may confuse Latin American speakers
3. Regional food variations could be expanded (Caribbean, South American)

---

## CONTENT SYNCHRONIZATION ISSUES

The following sections in the English file have been updated but translations may be outdated:

### Potentially Missing Updates

**EN Line 89-91 (Staging Section)**:
English now has:
```json
"introTitle": "Risk Assessment",
"introText": "This self-assessment is for educational purposes only and is NOT a clinical diagnosis..."
```

**Check PT/ES**: Verify both translations include the updated disclaimer language about this being educational, not diagnostic.

**Medication Warnings**: The English file includes updated medication side effect warnings (Fournier's gangrene for SGLT2i, gallbladder issues for GLP-1). Verify these are present in translations.

---

## RECOMMENDATIONS

### Immediate Actions (Critical)

1. **Spanish (es.json)**: Replace all Portuguese text in `clinic` section (lines 37-42) with proper Spanish translations
2. **Spanish (es.json)**: Fix line 178 `staging.plan.lifestyleActions.diet` - replace Portuguese with Spanish
3. **Spanish (es.json)**: Fix line 76 "acumulação" → "acumulación"

### High Priority

4. **Spanish (es.json)**: Search for and replace all remaining Portuguese words:
   - "mitocôndrias" → "mitocondrias"
   - "flexibilidade" → "flexibilidad"
   - "Progresso" → "Progreso"
   - "uma" → "una"
   - "Gastam" → "Gastan"
   - "e peso" → "y peso"

5. **Portuguese (pt.json)**: Fix "Progreso" → "Progresso" (line 22)

### Medium Priority

6. Standardize regional Spanish to Latin American conventions
7. Standardize Portuguese to Brazilian Portuguese conventions
8. Review all medical terminology for consistency
9. Add inverted punctuation marks (¿¡) where missing in Spanish

### Low Priority

10. Expand cultural food examples for both languages
11. Add more community-specific resources
12. Review for natural flow and readability

---

## APPENDIX: Issue Location Reference

### Spanish (es.json) - Portuguese Text Contamination Map

| Line(s) | Section | Issue Type |
|---------|---------|------------|
| 37-42 | clinic.* | Full section in Portuguese |
| 76 | anatomy.details.kidneys.connection | Single word ("acumulação") |
| 178 | staging.plan.lifestyleActions.diet | Full sentence in Portuguese |
| 286 | modules.content.3.sections[2].content | "mitocôndrias" |
| 287 | modules.content.3.sections[2].expanded | "flexibilidade" |
| 845 | modules.movementExplorer.slides[2].lesson | "Progresso" |
| 880 | modules.foodLabel.slides[0].text | "uma" |
| 1000 | modules.foodLabel.slides[5].text | "Gastam" |
| 1104 | modules.metricsDashboard.categories.bmi.desc | "e peso" |

---

## Conclusion

The Portuguese translation is of high quality with only minor issues. The Spanish translation requires significant remediation due to Portuguese text contamination throughout the file, suggesting copy-paste errors during the translation process. After fixing the critical and major issues, both translations will provide accurate, culturally appropriate medical education content.

**Recommended Next Steps**:
1. Fix all critical issues immediately before deployment
2. Perform a full search-and-replace for Portuguese words in es.json
3. Have a native Spanish speaker review the entire es.json file
4. Sync both translations with any recent English content updates
5. Implement a translation review workflow to prevent future contamination

---

*Report generated by EMPOWER-CKM Translation Audit*
*Audit Date: January 20, 2026*
