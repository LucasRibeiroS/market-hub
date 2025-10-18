import { Body, Container, Head, Heading, Hr, Html, Link, Preview, render, Section, Tailwind, Text } from '@react-email/components'

import { config } from '@utils/tailwind'

type IResetPasswordEmailParams = {
	name: string
	code: string
}

export const ResetPasswordEmailTemplate = ({ name, code }: IResetPasswordEmailParams) => {
	return (
		<Html lang="pt-br">
			<Head />
			<Preview>Aqui está seu código para redefinição de senha</Preview>
			<Tailwind config={config}>
				<Body className="my-auto mx-auto font-sans px-2">
					<Container className="border border-solid border-[#DEDEDE] rounded my-[40px] mx-auto px-[32px] pt-[24px] max-w-[640px]">
						<Section className="mb-[48px]">
						</Section>
						<Heading className="text-black text-[18px] font-bold text-center p-0 mb-[30px] mx-0">
							Olá, {name}!
						</Heading>
						<Text className="text-black text-[14px] leading-[24px] text-center">
							Recebemos sua solicitação para redefinir a senha da sua
							conta. Para continuar, use o código abaixo:
						</Text>
						<Section className='border-[2px] border-solid border-primary w-fit px-[24px] rounded-[8px]'>
							<Text className='text-black text-[24px] font-bold tracking-[8px]'>
								{code}
							</Text>
						</Section>
						<Text className="text-black text-[14px] text-center leading-[24px]">
							Por motivos de segurança, este código é válido por 24 horas.
							Se você não fez essa solicitação, por favor, desconsidere este
							e-mail e entre em contato com nossa equipe de suporte.
						</Text>
						<Text className="text-black text-[14px] text-center leading-[24px]">
							Lembre-se de criar uma senha forte e segura, combinando
							letras, números e caracteres especiais.
						</Text>
						<Text className="text-black text-[14px] text-center leading-[24px]">
							Estamos à disposição para ajudar!
						</Text>
						<Text className="text-black text-[14px] text-center m-0 leading-0">
							Atenciosamente,<br/>
							<span className='text-center text-[14px] text-gray'>Equipe MarketHub</span>
						</Text>
						<Hr className="color-mediumgray mx-0 w-full h-[1px]" />
						<Text className="text-gray text-[12px] text-center">
							Powered by <Link href=""className='text-primary font-semibold'>MarketHub©</Link>
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	)
}

export const getResetPasswordEmail = (data: IResetPasswordEmailParams) => {
	return render(ResetPasswordEmailTemplate(data))
}

ResetPasswordEmailTemplate.PreviewProps = {
	name: 'Lucas',
	code: 'C5DC6A'
} as IResetPasswordEmailParams

export default ResetPasswordEmailTemplate