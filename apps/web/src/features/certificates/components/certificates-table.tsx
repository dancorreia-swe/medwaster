import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Award } from "lucide-react";
import { CertificateRow } from "./table/certificate-row";

export interface CertificateTableItem {
	id: number;
	uuid: string;
	userId: string;
	status: "pending" | "approved" | "rejected" | "revoked";
	averageScore: number;
	totalTrailsCompleted: number;
	totalTimeMinutes: number;
	allTrailsCompletedAt: Date | string;
	verificationCode: string;
	reviewedBy?: string | null;
	reviewedAt?: Date | string | null;
	reviewNotes?: string | null;
	certificateUrl?: string | null;
	issuedAt?: Date | string | null;
	createdAt: Date | string;
	updatedAt: Date | string;
	user: {
		id: string;
		name: string;
		email: string;
	};
}

interface CertificatesTableProps {
	data: CertificateTableItem[];
	onApprove?: (certificate: CertificateTableItem) => void;
	onReject?: (certificate: CertificateTableItem) => void;
	onView?: (certificate: CertificateTableItem) => void;
}

export function CertificatesTable({ data, onApprove, onReject, onView }: CertificatesTableProps) {
	return (
		<div className="rounded-md border border-border bg-card">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Aluno</TableHead>
						<TableHead>Média</TableHead>
						<TableHead>Trilhas</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Concluído em</TableHead>
						<TableHead className="w-20">Ações</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{data.length ? (
						data.map((certificate) => (
							<CertificateRow
								key={certificate.id}
								certificate={certificate}
								onApprove={onApprove}
								onReject={onReject}
								onView={onView}
							/>
						))
					) : (
						<TableRow>
							<TableCell colSpan={6} className="p-6">
								<Empty className="py-10">
									<EmptyHeader>
										<EmptyMedia variant="icon">
											<Award className="size-5" />
										</EmptyMedia>
										<EmptyTitle>Nenhum certificado encontrado</EmptyTitle>
										<EmptyDescription>
											Não há certificados pendentes no momento.
										</EmptyDescription>
									</EmptyHeader>
								</Empty>
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}
