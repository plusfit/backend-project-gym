import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Matches, MaxLength } from "class-validator";

/**
 * A test send: the campaign body, but to the admin's own phone. The frontend
 * ships the message with {nombre} already replaced by a sample, so the test
 * reads exactly like the real thing.
 */
export class TestSendDto {
    @ApiProperty({
        example: "099123456",
        description: "Phone that receives the test, in any format the gym uses",
    })
    @IsString()
    @IsNotEmpty()
    phone!: string;

    @ApiProperty({
        example: "Hola Ana!",
        description: "Message body; line breaks are preserved",
        maxLength: 4096,
    })
    @IsString()
    @IsNotEmpty()
    @Matches(/\S/, { message: "message must not be blank" })
    @MaxLength(4096)
    message!: string;
}

export interface TestSendResponse {
    jobId: string;
    status: string;
    scheduledFor: string;
}
