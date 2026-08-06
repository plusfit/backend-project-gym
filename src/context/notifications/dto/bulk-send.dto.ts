import { ApiProperty } from "@nestjs/swagger";
import {
    ArrayMaxSize,
    ArrayNotEmpty,
    IsArray,
    IsMongoId,
    IsNotEmpty,
    IsString,
    Matches,
    MaxLength,
} from "class-validator";

/**
 * File-less bulk send. The dashboard posts the client ids it selected and the
 * message; the backend resolves those ids to phones, so the browser never gets
 * to name a phone number itself.
 */
export class BulkSendDto {
    @ApiProperty({
        example: ["507f1f77bcf86cd799439011"],
        description: "Ids of the clients selected in the dashboard",
        type: [String],
    })
    @IsArray()
    @ArrayNotEmpty()
    @ArrayMaxSize(1000)
    // Guards the Mongo query: a malformed id would raise a CastError inside find().
    @IsMongoId({ each: true })
    clientIds!: string[];

    @ApiProperty({
        example: "Hello from Plus Fit!",
        description: "Message sent to every recipient; line breaks are preserved",
        maxLength: 4096,
    })
    @IsString()
    @IsNotEmpty()
    // IsNotEmpty accepts a string of blanks, which is not a message.
    @Matches(/\S/, { message: "message must not be blank" })
    @MaxLength(4096)
    message!: string;
}

export type SkippedReason = "not_found" | "no_phone" | "invalid_phone" | "duplicate_phone";

export interface SkippedRecipient {
    clientId: string;
    name: string | null;
    reason: SkippedReason;
}

export interface BulkSendResponse {
    batchId: string;
    /** Recipients actually enqueued. */
    total: number;
    /** Client ids received, so the dashboard can show selected vs sent. */
    requested: number;
    skipped: SkippedRecipient[];
}
