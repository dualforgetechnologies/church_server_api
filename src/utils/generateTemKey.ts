export function generateTempKey(firstName: string, lastName: string, randomLength = 8): string {
    const sanitize = (str: string) => (str ?? '').replace(/[^a-zA-Z]/g, '');

    const cleanFirstName = sanitize(firstName);
    const cleanLastName = sanitize(lastName);

    const namePrefix =
        cleanFirstName.length > 0
            ? cleanFirstName.charAt(0).toUpperCase() + cleanFirstName.slice(1, 2).toLowerCase()
            : 'U';

    const number = String(Math.floor(100 + Math.random() * 900));

    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const symbols = '!@$*';

    const allChars = upper + lower + digits + symbols;

    const getRandomChar = (chars: string) => chars[Math.floor(Math.random() * chars.length)];

    const requiredChars = [getRandomChar(upper), getRandomChar(lower), getRandomChar(digits), getRandomChar(symbols)];

    while (requiredChars.length < randomLength) {
        requiredChars.push(getRandomChar(allChars));
    }

    const shuffled = requiredChars.sort(() => 0.5 - Math.random()).join('');

    return `${namePrefix}${cleanLastName.charAt(0).toUpperCase()}${number}${shuffled}`;
}
