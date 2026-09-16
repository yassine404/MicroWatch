package com.dxc.observability.sla_service.service;

import com.dxc.observability.sla_service.entity.SlaRecord;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.xhtmlrenderer.pdf.ITextRenderer;

import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class PdfService {

    private final TemplateEngine templateEngine;

    public byte[] generateSlaReport(String serviceName, List<SlaRecord> records, String from, String to) {
        try {
            Context context = new Context(Locale.FRENCH);
            context.setVariable("serviceName", serviceName);
            context.setVariable("from", from);
            context.setVariable("to", to);
            context.setVariable("records", records);

            String html = templateEngine.process("sla-report", context);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            ITextRenderer renderer = new ITextRenderer();
            renderer.setDocumentFromString(html);
            renderer.layout();
            renderer.createPDF(outputStream);

            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la génération du PDF", e);
        }
    }
}