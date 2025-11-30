import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { fixEncoding } from './stringUtils';

export const generateOrderReceipt = (order) => {
    // Initialize PDF with 80mm width (standard thermal paper)
    // Height is variable, but we set a long initial height which we can crop or just leave as is for digital view
    // 80mm = ~226 points. 
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 200] //80mm width, 200mm initial height (auto-height would be better but fixed is easier for now)
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 5;
    const contentWidth = pageWidth - (margin * 2);
    let yPos = 10;

    // Helper for centered text
    const centerText = (text, y, size = 10, style = 'normal') => {
        doc.setFontSize(size);
        doc.setFont('helvetica', style);
        const textWidth = doc.getTextWidth(text);
        const x = (pageWidth - textWidth) / 2;
        doc.text(text, x, y);
        return y + size / 2 + 2; // Return next Y position
    };

    // Helper for left-right text
    const rowText = (label, value, y, size = 9) => {
        doc.setFontSize(size);
        doc.setFont('helvetica', 'normal');
        doc.text(label, margin, y);

        const valueWidth = doc.getTextWidth(value);
        doc.text(value, pageWidth - margin - valueWidth, y);
        return y + 5;
    };

    // --- HEADER ---
    yPos = centerText('PEDIDOS APP', yPos, 14, 'bold');
    yPos += 2;
    yPos = centerText('Recibo de Pedido', yPos, 10, 'normal');
    yPos += 5;

    // --- ORDER INFO ---
    doc.setLineWidth(0.1);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 5;

    yPos = rowText('Pedido #:', order.id.toString(), yPos);
    yPos = rowText('Fecha:', new Date(order.created_at).toLocaleDateString(), yPos);
    yPos = rowText('Estado:', order.status, yPos);
    yPos += 2;

    // --- CLIENT INFO ---
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Cliente:', margin, yPos);
    yPos += 5;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    // Handle client data safely
    const clientName = fixEncoding(order.customer || 'Cliente General');
    doc.text(clientName, margin, yPos);
    yPos += 5;

    if (order.clientes) {
        if (order.clientes.rif_cedula) {
            doc.text(`Doc: ${order.clientes.rif_cedula}`, margin, yPos);
            yPos += 5;
        }
        if (order.clientes.phone) {
            doc.text(`Tel: ${order.clientes.phone}`, margin, yPos);
            yPos += 5;
        }
        if (order.clientes.address) {
            const splitAddress = doc.splitTextToSize(`Dir: ${fixEncoding(order.clientes.address)}`, contentWidth);
            doc.text(splitAddress, margin, yPos);
            yPos += (splitAddress.length * 4) + 2;
        }
    }

    yPos += 2;

    // --- ADVISOR INFO ---
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Asesora:', margin, yPos);
    const advisorName = fixEncoding(order.asesora || '-');
    const advisorWidth = doc.getTextWidth(advisorName);
    doc.setFont('helvetica', 'normal');
    doc.text(advisorName, pageWidth - margin - advisorWidth, yPos);
    yPos += 6;

    // --- ITEMS TABLE ---
    const tableColumn = ["Cant", "Desc", "Total"];
    const tableRows = [];

    let orderItems = [];
    if (typeof order.items === 'string') {
        try {
            orderItems = JSON.parse(order.items);
        } catch (e) {
            orderItems = [];
        }
    } else {
        orderItems = order.items || [];
    }

    orderItems.forEach(item => {
        const itemTotal = (item.quantity * item.unitCost).toFixed(2);
        // Combine description and characteristics
        let desc = item.description;
        if (item.characteristics) {
            desc += `\n(${item.characteristics})`;
        }
        tableRows.push([item.quantity, desc, `$${itemTotal}`]);
    });

    autoTable(doc, {
        startY: yPos,
        head: [tableColumn],
        body: tableRows,
        theme: 'plain',
        styles: { fontSize: 8, cellPadding: 1, overflow: 'linebreak' },
        headStyles: { fontStyle: 'bold', fillColor: [220, 220, 220], textColor: 0 },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' }, // Cant
            1: { cellWidth: 'auto' }, // Desc
            2: { cellWidth: 15, halign: 'right' } // Total
        },
        margin: { left: margin, right: margin },
        tableWidth: contentWidth,
    });

    yPos = doc.lastAutoTable.finalY + 5;

    // --- TOTALS ---
    doc.setLineWidth(0.1);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 5;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const totalStr = `Total: $${(order.total || 0).toFixed(2)}`;
    const totalWidth = doc.getTextWidth(totalStr);
    doc.text(totalStr, pageWidth - margin - totalWidth, yPos);
    yPos += 10;

    // --- FOOTER ---
    centerText('¡Gracias por su compra!', yPos, 10, 'italic');

    // Save - Generate filename: Asesora_Cliente_Fecha
    const safeAdvisor = (order.asesora || 'Asesora').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const safeClient = (order.customer || 'Cliente').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const dateStr = new Date(order.created_at).toLocaleDateString('es-VE').replace(/\//g, '-');
    const filename = `${safeAdvisor}_${safeClient}_${dateStr}.pdf`;

    doc.save(filename);
};
