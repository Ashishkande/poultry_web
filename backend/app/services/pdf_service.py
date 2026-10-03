import io
from datetime import datetime
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

class PDFService:
    @staticmethod
    def generate_mortality_report(report_data: dict) -> io.BytesIO:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()

        # Custom styles
        title_style = ParagraphStyle(
            name="TitleStyle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=20,
            leading=24,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#166534")  # Emerald 800
        )

        subtitle_style = ParagraphStyle(
            name="SubtitleStyle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=11,
            leading=15,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#475569")
        )

        section_heading = ParagraphStyle(
            name="SectionHeading",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=16,
            textColor=colors.HexColor("#1e293b")
        )

        body_style = ParagraphStyle(
            name="BodyStyle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#334155")
        )

        cell_bold = ParagraphStyle(
            name="CellBold",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#1e293b")
        )

        table_header = ParagraphStyle(
            name="TableHeader",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=12,
            textColor=colors.white
        )

        elements = []

        # 1. Header
        elements.append(Paragraph("POULTRY FARM MORTALITY REPORT", title_style))
        elements.append(Spacer(1, 4))
        elements.append(Paragraph("Official Mortality Record & Audit Summary", subtitle_style))
        elements.append(Spacer(1, 14))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#16a34a"), spaceBefore=0, spaceAfter=14))

        # 2. Scope & Metadata Grid
        date_range_str = f"{report_data.get('date_from', 'Beginning')}  to  {report_data.get('date_to', 'Current')}"
        info_data = [
            [
                Paragraph("<b>Farm:</b>", cell_bold),
                Paragraph(report_data.get("farm_name", "All Farms"), body_style),
                Paragraph("<b>Batch:</b>", cell_bold),
                Paragraph(report_data.get("batch_number", "All Batches"), body_style)
            ],
            [
                Paragraph("<b>Shade:</b>", cell_bold),
                Paragraph(report_data.get("shade_name", "All Shades"), body_style),
                Paragraph("<b>Date Range:</b>", cell_bold),
                Paragraph(date_range_str, body_style)
            ]
        ]
        info_table = Table(info_data, colWidths=[65, 195, 75, 185])
        info_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(info_table)
        elements.append(Spacer(1, 14))

        # 3. KPI Summary Table
        elements.append(Paragraph("KEY BATCH METRICS", section_heading))
        elements.append(Spacer(1, 6))

        initial_b = report_data.get("initial_birds", 0)
        current_b = report_data.get("current_birds", 0)
        total_m = report_data.get("total_mortality", 0)
        mort_pct = report_data.get("mortality_percentage", 0.0)

        kpi_data = [
            [
                Paragraph("Initial Birds", subtitle_style),
                Paragraph("Current Birds", subtitle_style),
                Paragraph("Total Mortality", subtitle_style),
                Paragraph("Mortality Rate", subtitle_style)
            ],
            [
                Paragraph(f"<b>{initial_b:,}</b>", title_style),
                Paragraph(f"<b>{current_b:,}</b>", title_style),
                Paragraph(f"<b>{total_m:,}</b>", ParagraphStyle(name="RedKpi", parent=title_style, textColor=colors.HexColor("#dc2626"))),
                Paragraph(f"<b>{mort_pct:.2f}%</b>", ParagraphStyle(name="PctKpi", parent=title_style, textColor=colors.HexColor("#d97706")))
            ]
        ]
        kpi_table = Table(kpi_data, colWidths=[130, 130, 130, 130])
        kpi_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f0fdf4")),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#bbf7d0")),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#bbf7d0")),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(kpi_table)
        elements.append(Spacer(1, 16))

        # 4. Detailed Records Table
        elements.append(Paragraph("DAILY MORTALITY LOG ENTRIES", section_heading))
        elements.append(Spacer(1, 6))

        records = report_data.get("records", [])
        table_rows = [
            [
                Paragraph("Date", table_header),
                Paragraph("Shade", table_header),
                Paragraph("Batch", table_header),
                Paragraph("Mortality", table_header),
                Paragraph("Reason", table_header),
                Paragraph("Remarks", table_header),
                Paragraph("Reported By", table_header)
            ]
        ]

        if not records:
            table_rows.append([
                Paragraph("No mortality records found for selected criteria.", body_style),
                "", "", "", "", "", ""
            ])
        else:
            for r in records:
                table_rows.append([
                    Paragraph(str(r.get("date", "")), body_style),
                    Paragraph(str(r.get("shade_name", "")), body_style),
                    Paragraph(str(r.get("batch_number", "")), body_style),
                    Paragraph(f"<b>{r.get('mortality_count', 0)}</b>", cell_bold),
                    Paragraph(str(r.get("reason", "")), body_style),
                    Paragraph(str(r.get("remarks") or "-"), body_style),
                    Paragraph(str(r.get("manager_name", "")), body_style),
                ])

        record_table = Table(table_rows, colWidths=[65, 80, 75, 55, 85, 95, 65])
        record_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#15803d")),
            ('ALIGN', (3, 1), (3, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(record_table)
        elements.append(Spacer(1, 20))

        # 5. Footer Details
        gen_at = report_data.get("generated_at", datetime.now().strftime("%d-%m-%Y %H:%M"))
        gen_by = report_data.get("generated_by", "Authorized User")
        footer_text = f"<b>Generated On:</b> {gen_at} &nbsp;&nbsp;|&nbsp;&nbsp; <b>Generated By:</b> {gen_by} &nbsp;&nbsp;|&nbsp;&nbsp; <b>Status:</b> Official System Report"
        elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cbd5e1"), spaceBefore=10, spaceAfter=8))
        elements.append(Paragraph(footer_text, subtitle_style))

        doc.build(elements)
        buffer.seek(0)
        return buffer
