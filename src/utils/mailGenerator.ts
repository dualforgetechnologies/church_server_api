import fs from 'node:fs';
import path from 'node:path';
import { MailTemplateParamKey, TemplateParams } from '@/types/mail';

/**
 * Custom error class for handling email template issues.
 */
export class EmailTemplateError extends Error {
    constructor(
        message: string,
        public templateName: string,
        public filePath: string,
    ) {
        super(message);
        this.name = 'EmailTemplateError';
    }
}

/**
 * Loads an email HTML template file from the specified templates directory.
 * @param templateName - Name of the template (without `.html` extension)
 * @returns Raw HTML content as a string
 * @throws EmailTemplateError if the template file does not exist
 */
export function loadEmailTemplate(templateName: string): string {
    const templatePath = path.resolve(process.cwd(), 'src/artifacts/templates', `${templateName}.html`);

    if (!fs.existsSync(templatePath)) {
        throw new EmailTemplateError(`Template "${templateName}" not found.`, templateName, templatePath);
    }

    try {
        return fs.readFileSync(templatePath, 'utf-8');
    } catch (error: unknown) {
        throw new EmailTemplateError(`Failed to read template "${templateName}".`, templateName, templatePath);
    }
}

/**
 * Replaces placeholders in the template string with values from params.
 * Template placeholders must be in the format {{ key }}.
 * @param template - Raw template string
 * @param params - Key-value pairs to inject into the template
 * @returns Final rendered template
 */
export function renderTemplate(template: string, params: TemplateParams): string {
    return template.replace(/{{\s*(\w+)\s*}}/g, (_, key: string) => {
        return Object.prototype.hasOwnProperty.call(params, key) ? String(params[key as MailTemplateParamKey]) : '';
    });
}

/**
 * Loads and renders an HTML email template with given parameters.
 * @param templateName - Template file name (without `.html`)
 * @param params - Parameters to inject into the template
 * @returns Rendered HTML email content
 */
export function getRenderedEmail(templateName: string, params: TemplateParams): string {
    const template = loadEmailTemplate(templateName);
    return renderTemplate(template, params);
}
