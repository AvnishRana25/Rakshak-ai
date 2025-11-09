from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from datetime import datetime
from collections import Counter
import io

def generate_pdf_report(alerts, ip_stats=None, date_range=None):
    """Generate PDF report from alerts"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
    
    # Container for the 'Flowable' objects
    elements = []
    
    # Define styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#9333EA'),
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor('#EC4899'),
        spaceAfter=12
    )
    
    # Title
    elements.append(Paragraph("URL Attack Detector - Security Report", title_style))
    elements.append(Spacer(1, 0.2*inch))
    
    # Report metadata
    now = datetime.now()
    elements.append(Paragraph(f"<b>Generated:</b> {now.strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
    if date_range:
        elements.append(Paragraph(f"<b>Date Range:</b> {date_range}", styles['Normal']))
    elements.append(Paragraph(f"<b>Total Alerts:</b> {len(alerts)}", styles['Normal']))
    elements.append(Spacer(1, 0.3*inch))
    
    # Executive Summary
    elements.append(Paragraph("Executive Summary", heading_style))
    
    if not alerts:
        elements.append(Paragraph("No alerts found in the selected time range.", styles['Normal']))
        # Still build the PDF with just the header
    elif alerts:
        # Attack type distribution
        attack_types = Counter([a.get('attack', 'Unknown') for a in alerts])
        high_confidence = len([a for a in alerts if a.get('confidence', 0) >= 80])
        critical_alerts = len([a for a in alerts if a.get('priority') == 'critical' or (a.get('confidence', 0) >= 90)])
        
        summary_data = [
            ['Metric', 'Value'],
            ['Total Alerts', str(len(alerts))],
            ['High Confidence Alerts (≥80%)', str(high_confidence)],
            ['Critical Priority Alerts', str(critical_alerts)],
            ['Unique Attack Types', str(len(attack_types))],
            ['Top Attack Type', attack_types.most_common(1)[0][0] if attack_types else 'N/A']
        ]
        
        summary_table = Table(summary_data, colWidths=[3*inch, 2*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#9333EA')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey)
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 0.3*inch))
        
        # Attack Type Distribution
        elements.append(Paragraph("Attack Type Distribution", heading_style))
        attack_data = [['Attack Type', 'Count', 'Percentage']]
        total = len(alerts)
        for attack_type, count in attack_types.most_common():
            percentage = (count / total * 100) if total > 0 else 0
            attack_data.append([attack_type, str(count), f"{percentage:.1f}%"])
        
        attack_table = Table(attack_data, colWidths=[2.5*inch, 1*inch, 1.5*inch])
        attack_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#EC4899')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.beige])
        ]))
        elements.append(attack_table)
        elements.append(PageBreak())
        
        # Top Attacking IPs
        if ip_stats:
            elements.append(Paragraph("Top Attacking IPs", heading_style))
            ip_data = [['IP Address', 'Attack Count', 'Country']]
            for ip_stat in ip_stats[:10]:  # Top 10
                ip_data.append([
                    ip_stat.get('ip', 'Unknown'),
                    str(ip_stat.get('count', 0)),
                    ip_stat.get('country', 'Unknown')
                ])
            
            ip_table = Table(ip_data, colWidths=[2*inch, 1.5*inch, 1.5*inch])
            ip_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#9333EA')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 11),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.lightgrey),
                ('GRID', (0, 0), (-1, -1), 1, colors.grey),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.beige])
            ]))
            elements.append(ip_table)
            elements.append(Spacer(1, 0.3*inch))
    
    # Detailed Alerts (limited to most recent 50)
    elements.append(Paragraph("Recent Alerts (Top 50)", heading_style))
    alert_data = [['ID', 'Timestamp', 'Source IP', 'Attack Type', 'Confidence']]
    
    for alert in alerts[:50]:
        timestamp = alert.get('timestamp', '')
        if timestamp:
            try:
                # Handle both string and datetime objects
                if isinstance(timestamp, str):
                    # Try parsing ISO format
                    try:
                        dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                    except:
                        # Try parsing other common formats
                        try:
                            dt = datetime.strptime(timestamp, '%Y-%m-%d %H:%M:%S')
                        except:
                            dt = datetime.now()
                    timestamp = dt.strftime('%Y-%m-%d %H:%M')
                elif hasattr(timestamp, 'strftime'):
                    # It's already a datetime object
                    timestamp = timestamp.strftime('%Y-%m-%d %H:%M')
                else:
                    timestamp = str(timestamp)[:16]
            except Exception as e:
                import sys
                sys.stderr.write(f"Error formatting timestamp: {e}\n")
                timestamp = str(timestamp)[:16] if timestamp else ''
        
        alert_data.append([
            str(alert.get('id', '')),
            timestamp[:16] if timestamp else '',
            alert.get('src_ip', '')[:15],
            alert.get('attack', '')[:20],
            f"{alert.get('confidence', 0)}%"
        ])
    
    if len(alert_data) > 1:
        alert_table = Table(alert_data, colWidths=[0.5*inch, 1.2*inch, 1.2*inch, 1.5*inch, 1*inch])
        alert_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#EC4899')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.beige])
        ]))
        elements.append(alert_table)
    
    # Build PDF
    try:
        doc.build(elements)
        buffer.seek(0)
        return buffer
    except Exception as e:
        import sys
        import traceback
        error_trace = traceback.format_exc()
        sys.stderr.write(f"Error building PDF: {e}\n{error_trace}\n")
        raise

