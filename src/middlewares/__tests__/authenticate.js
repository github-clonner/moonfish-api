const authenticate = require('../authenticate');
const { context } = require('../../test-helpers');
const jwt = require('jsonwebtoken');
const config = require('../../lib/config');

describe('authenticate', () => {
  it('should trigger an error if jwt token can not be found', async () => {
    const middleware = authenticate();
    let ctx;
    ctx = context({ headers: { notAuthorization: 'Bearer $token' } });
    await expect(middleware(ctx)).rejects.toHaveProperty('message', 'no jwt token found');

    ctx = context({ headers: { authorization: 'not Bearer $token' } });
    await expect(middleware(ctx)).rejects.toHaveProperty('message', 'no jwt token found');

    const customTokenLocation = authenticate({}, { getToken: () => null });
    ctx = context({ headers: { authorization: 'Bearer $token' } });
    await expect(customTokenLocation(ctx)).rejects.toHaveProperty('message', 'no jwt token found');
  });

  it('should trigger an error if token is bad', async () => {
    const middleware = authenticate();
    let ctx;
    ctx = context({ headers: { authorization: 'Bearer badToken' } });
    await expect(middleware(ctx)).rejects.toHaveProperty('message', 'bad jwt token');
    ctx = context({});

    const customTokenLocation = authenticate({}, { getToken: () => 'bad token' });
    await expect(customTokenLocation(ctx)).rejects.toHaveProperty('message', 'bad jwt token');
  });

  it('should confirm that token has a valid kid', async () => {
    const middleware = authenticate();
    const token = jwt.sign({ kid: 'not valid kid' }, 'verysecret');
    const ctx = context({ headers: { authorization: `Bearer ${token}` } });
    await expect(middleware(ctx)).rejects.toHaveProperty('message', 'jwt token does not match supported kid');
  });

  it('should confirm that type if specify in middleware', async () => {
    const middleware = authenticate({
      type: 'sometype'
    });

    const token = jwt.sign({ kid: 'applicant', type: 'not same type' }, 'verysecret');
    const ctx = context({ headers: { authorization: `Bearer ${token}` } });
    await expect(middleware(ctx)).rejects.toHaveProperty('message', 'endpoint requires jwt token payload match type "sometype"');
  });

  it('should fail if token doesnt have rigth signature', async () => {
    const middleware = authenticate();
    const token = jwt.sign({ kid: 'applicant' }, 'verysecret');
    const ctx = context({ headers: { authorization: `Bearer ${token}` } });
    await expect(middleware(ctx)).rejects.toHaveProperty('message', 'invalid signature');
  });

  it('should fail if expired', async () => {
    const middleware = authenticate();
    const token = jwt.sign({ kid: 'applicant' }, config.get('jwt.secret'), { expiresIn: 0 });
    const ctx = context({ headers: { authorization: `Bearer ${token}` } });
    await expect(middleware(ctx)).rejects.toHaveProperty('message', 'jwt expired');
  });

  it('it should work with valid secet and not expired', async () => {
    const middleware = authenticate();
    const token = jwt.sign({ kid: 'applicant', attribute: 'value' }, config.get('jwt.secret'));
    const ctx = context({ headers: { authorization: `Bearer ${token}` } });
    await middleware(ctx, () => {
      expect(ctx.state.jwt.attribute).toBe('value');
    });
  });
});