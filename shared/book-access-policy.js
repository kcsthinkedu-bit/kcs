const ROLES = Object.freeze({
  GUEST: "guest",
  MEMBER: "member",
  STUDENT: "student",
  TEACHER: "teacher",
});

const ACTIONS = Object.freeze({
  EDIT_LOCAL_BOOK: "edit-local-book",
  SAVE_TO_ACCOUNT: "save-to-account",
  INVITE_STUDENT: "invite-student",
  VIEW_STUDENT_WORK: "view-student-work",
  SUBMIT_WORK: "submit-work",
  EDIT_SUBMISSION: "edit-submission",
  RETURN_WORK: "return-work",
  PUBLISH_FINAL: "publish-final",
});

const SERVER_ONLY_ACTIONS = new Set([
  ACTIONS.SAVE_TO_ACCOUNT,
  ACTIONS.INVITE_STUDENT,
  ACTIONS.VIEW_STUDENT_WORK,
  ACTIONS.SUBMIT_WORK,
  ACTIONS.EDIT_SUBMISSION,
  ACTIONS.RETURN_WORK,
  ACTIONS.PUBLISH_FINAL,
]);

const ROLE_ACTIONS = Object.freeze({
  [ROLES.GUEST]: new Set([ACTIONS.EDIT_LOCAL_BOOK]),
  [ROLES.MEMBER]: new Set([
    ACTIONS.EDIT_LOCAL_BOOK,
    ACTIONS.SAVE_TO_ACCOUNT,
    ACTIONS.PUBLISH_FINAL,
  ]),
  [ROLES.STUDENT]: new Set([
    ACTIONS.EDIT_LOCAL_BOOK,
    ACTIONS.SAVE_TO_ACCOUNT,
    ACTIONS.SUBMIT_WORK,
  ]),
  [ROLES.TEACHER]: new Set([
    ACTIONS.EDIT_LOCAL_BOOK,
    ACTIONS.SAVE_TO_ACCOUNT,
    ACTIONS.INVITE_STUDENT,
    ACTIONS.VIEW_STUDENT_WORK,
    ACTIONS.EDIT_SUBMISSION,
    ACTIONS.RETURN_WORK,
    ACTIONS.PUBLISH_FINAL,
  ]),
});

function normalizeRole(value) {
  return Object.values(ROLES).includes(value) ? value : ROLES.GUEST;
}

function createAnonymousAccess() {
  return Object.freeze({
    authenticated: false,
    role: ROLES.GUEST,
    userId: null,
    academyId: null,
    classIds: [],
    verifiedByServer: false,
  });
}

function normalizeAccessSession(session) {
  if (!session || session.authenticated !== true || !session.userId) {
    return createAnonymousAccess();
  }

  return Object.freeze({
    authenticated: true,
    role: normalizeRole(session.role),
    userId: String(session.userId),
    academyId: session.academyId ? String(session.academyId) : null,
    classIds: Array.isArray(session.classIds)
      ? session.classIds.filter(Boolean).map(String)
      : [],
    verifiedByServer: session.verifiedByServer === true,
  });
}

function canPerform(action, session) {
  const access = normalizeAccessSession(session);
  const permitted = ROLE_ACTIONS[access.role]?.has(action) === true;

  if (!permitted) {
    return false;
  }

  if (SERVER_ONLY_ACTIONS.has(action)) {
    return access.authenticated && access.verifiedByServer;
  }

  return true;
}

function explainDeniedAction(action, session) {
  const access = normalizeAccessSession(session);

  if (!ROLE_ACTIONS[access.role]?.has(action)) {
    return "이 기능을 사용할 권한이 없습니다.";
  }

  if (SERVER_ONLY_ACTIONS.has(action) && !access.verifiedByServer) {
    return "로그인과 서버 권한 확인이 필요한 기능입니다.";
  }

  return "지금은 이 기능을 사용할 수 없습니다.";
}

export {
  ACTIONS,
  ROLES,
  SERVER_ONLY_ACTIONS,
  canPerform,
  createAnonymousAccess,
  explainDeniedAction,
  normalizeAccessSession,
};
