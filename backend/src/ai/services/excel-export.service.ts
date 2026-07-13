import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as exceljs from 'exceljs';
import * as path from 'path';
import * as fs from 'fs';
import { AiGeneration } from '../entities/ai-generation.entity';

@Injectable()
export class ExcelExportService {
  private readonly logger = new Logger(ExcelExportService.name);
  private readonly uploadDir = path.join(__dirname, '..', '..', '..', 'uploads');
  private readonly logFilePath = path.join(this.uploadDir, 'content-log.xlsx');

  constructor(
    @InjectRepository(AiGeneration)
    private readonly aiGenerationRepository: Repository<AiGeneration>,
  ) {
    this.ensureUploadDirExists();
  }

  private ensureUploadDirExists() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Generates a complete snapshot of campaigns for a specific user and returns it as a Buffer
   */
  async generateExcelBuffer(userId: string): Promise<Buffer> {
    const campaigns = await this.aiGenerationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('Campaigns');

    this.configureWorksheet(worksheet);

    campaigns.forEach((campaign) => {
      worksheet.addRow(this.mapCampaignToRow(campaign));
    });

    return (await workbook.xlsx.writeBuffer()) as any as Buffer;
  }

  /**
   * Appends or updates a row in the global content-log.xlsx file when a posting action occurs
   */
  async logCampaignAction(campaign: AiGeneration): Promise<void> {
    const workbook = new exceljs.Workbook();
    let worksheet: exceljs.Worksheet;

    try {
      if (fs.existsSync(this.logFilePath)) {
        await workbook.xlsx.readFile(this.logFilePath);
        worksheet = workbook.getWorksheet('Content Log') || workbook.addWorksheet('Content Log');
      } else {
        worksheet = workbook.addWorksheet('Content Log');
      }

      this.configureWorksheet(worksheet);

      // Try to find if this campaign already exists in the log to update it
      let foundRow: exceljs.Row | undefined;
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1 && row.getCell(1).value === campaign.id) {
          foundRow = row;
        }
      });

      const rowData = this.mapCampaignToRow(campaign);

      if (foundRow) {
        foundRow.values = [
          rowData.id,
          rowData.subject,
          rowData.platform,
          rowData.status,
          rowData.scheduledAt,
          rowData.publishedAt,
          rowData.postId,
          rowData.createdAt,
        ];
      } else {
        worksheet.addRow(rowData);
      }

      await workbook.xlsx.writeFile(this.logFilePath);
      this.logger.log(`Campaign ${campaign.id} successfully logged to Excel file.`);
    } catch (error: any) {
      this.logger.error(`Failed to log campaign to Excel: ${error.message}`);
    }
  }

  private configureWorksheet(worksheet: exceljs.Worksheet) {
    if (!worksheet.columns || worksheet.columns.length === 0) {
      worksheet.columns = [
        { header: 'ID', key: 'id', width: 36 },
        { header: 'Subject', key: 'subject', width: 40 },
        { header: 'Platform', key: 'platform', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Scheduled At', key: 'scheduledAt', width: 20 },
        { header: 'Published At', key: 'publishedAt', width: 20 },
        { header: 'Post ID', key: 'postId', width: 25 },
        { header: 'Created At', key: 'createdAt', width: 20 },
      ];

      // Style the header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' },
      };
    }
  }

  private mapCampaignToRow(campaign: AiGeneration) {
    return {
      id: campaign.id,
      subject: campaign.subject,
      platform: campaign.platform,
      status: campaign.status,
      scheduledAt: campaign.scheduledAt ? new Date(campaign.scheduledAt).toLocaleString() : 'N/A',
      publishedAt: campaign.status === 'posted' ? new Date(campaign.updatedAt).toLocaleString() : 'N/A',
      postId: campaign.platformPostId || 'N/A',
      createdAt: new Date(campaign.createdAt).toLocaleString(),
    };
  }
}
