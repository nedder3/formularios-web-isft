# Sistema de Inscripción a Exámenes Finales — ISFT N° 191

Aplicación **Astro SSR (Server-Side Rendering)** para la inscripción a mesas de exámenes finales del **Instituto Superior de Formación Técnica N° 191 (Bahía Blanca)**, diseñada con persistencia en planillas Excel homogéneas por carrera y arquitectura lista para integración con **SIU Guaraní**.

---

## 1. Carreras y Resoluciones Sincronizadas (211 Materias)

El catálogo académico (`isft_191_scaffolding.json`) está contrastado y validado al 100% contra el Excel online institucional y el sitio oficial `isft191.edu.ar`:

| ID | Código | Carrera | Resolución | Materias |
| :-: | :-: | :--- | :-: | :-: |
| 1 | `SOFT` | Tecnicatura Superior en Desarrollo de Software | `RS 5847/19` | 22 |
| 2 | `ADU-5309` | Tecnicatura Superior en Régimen Aduanero | `RS 5309/24` | 23 |
| 3 | `ADU-1896` | Tecnicatura Superior en Régimen Aduanero | `RS 1896/09` | 25 |
| 4 | `LOG-5312` | Tecnicatura Superior en Logística | `RS 5312-24` | 29 |
| 5 | `LOG-1557` | Tecnicatura Superior en Logística | `RS 1557-07` | 24 |
| 6 | `CONT-455` | Tecnicatura Superior en Administración Contable | `RS 455-23` | 24 |
| 7 | `CONT-273` | Tecnicatura Superior en Administración Contable | `RS 273-03` | 38 |
| 8 | `GEST` | Tecnicatura Superior en Gestoría | `RS 4103/03` | 26 |

---

## 2. Formato Homogéneo de Salida Excel

Cada inscripción impacta en `data/output/Inscripciones_<CODIGO_CARRERA>.xlsx` (excluido de Git por `.gitignore`), respetando las **10 columnas exactas** del formato institucional (`formato_final_a_enviar.xlsx`):

1. `Apellido y Nombre`
2. `DNI`
3. `Teléfono`
4. `Dirección de correo electrónico`
5. `Cohorte`
6. `Año al que pertenece la materia que quiere rendir` (`Primero`, `Segundo`, `Tercero`)
7. `MODALIDAD` (`Regular`, `Libre`)
8. `MATERIA`
9. `AÑO DE CURSADO`
10. `PROFESOR`

---

## 3. Integración con el Portal WordPress (`isft191.edu.ar`)

El sistema soporta preselección de carrera y modo embebido limpio mediante parámetros URL:

- **Formulario general:** `https://inscripciones.isft191.edu.ar/`
- **Preseleccionado por carrera (ej. Gestoría):** `https://inscripciones.isft191.edu.ar/?carrera=GEST`
- **Modo embebido para WordPress (`iframe` sin cabecera duplicada):**
  ```html
  <iframe
    src="https://inscripciones.isft191.edu.ar/?carrera=GEST&embed=1"
    width="100%"
    height="760"
    style="border:none; border-radius:12px;"
    title="Inscripción a Finales ISFT 191"
  ></iframe>
  ```

---

## 4. Comandos de Desarrollo y Producción

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo Astro SSR
npm run dev

# Compilar para producción (Node Standalone SSR)
npm run build

# Ejecutar servidor Node SSR compilado
npm start
```
